// Imports
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var fs = require('fs');
var yaml = require('js-yaml');
var async = require('async');
var jade = require('jade');
var ircHandler = require('./ircHandler');
var STATES = ['completed', 'inprogress', 'impediments'];

var knexFile = require('./knexfile');
var knex = require('knex')(knexFile['development']);

// Load Configuration
var configFile = "./conf/custom-config.yaml";
if (process.argv.length > 2) {
  configFile = process.argv[2];
}
var contents = fs.readFileSync(configFile).toString();
var config = yaml.load(contents).config;

ircHandler.init(config);


// Timers
var timers = config.timers

// Initiate the web framework
var app = express();

app.set('views', __dirname + '/templates');
app.set('view engine', 'jade');
app.use('/static', express.static(__dirname + '/public'));

// Enable web framework to parse HTTP params
app.use(bodyParser.urlencoded({extended: false}));
// Enable cookie parsing on requests
app.use(cookieParser());

// Serve up the root which includes the form
app.get('/', function(req, res) {
  var locals = {completed: [], inprogress: [], impediments: []}

  function render(templateLocals) {
    if (!templateLocals) {
      templateLocals = {};
    }
    templateLocals.url = req.url;
    templateLocals.cookies = req.cookies;
    res.render('root.jade', templateLocals);
  }

  if (req.cookies.lastID) {
    knex('statuses').where({stats: req.cookies.lastID}).then(function(result) {
      for (var i=0; i<result.length; i++) {
        var row = result[i],
            key = STATES[row.state];
        locals[key].push(row.status);
      }
      render(locals);
    }).catch(function(err) {
      // TODO handle this error
    });
  } else {
    render(locals);
  }
});

app.get('/api/historical', function(req, res) {
  knex('stats').then(function(stats) {
    knex('statuses').then(function(statuses) {
      var locals = {
        statsID: stats,
        statuses: statuses,
        states: {},
        members: config.members
      };

      for (var k in STATES) {
        locals.states[k] = STATES[k];
      }

      var body = JSON.stringify(locals);
      res.set('Content-type', 'application/json');
      res.set('Content-length', body.length);
      res.write(body);
      res.end();
    }).catch(function(err) {
      res.send(JSON.stringify({error: 'Database connection failure'}));
    });
  }).catch(function(err) {
    res.send(JSON.stringify({error: 'Database connection failure'}));
  });
});

// Handle the API request
app.post('/irc', function(req, res){
  // build the output
  var result = "",
      finished = req.body.completed ? 1 : 0,
      inProgress = req.body.inprogress ? 1 : 0,
      impediments = req.body.impediments ? 1 : 0;

  var locals = {
      irc_nick: req.body.irc_nick,
      area: req.body.area,
      nl: '\n' //there has to be a better solution...
  };
  for (var k in STATES) {
    var key = STATES[k];
    locals[key] = req.body[key].split('\n');
  }

  if (!locals.irc_nick) {
    res.status(400);
    res.send('Error: IRC nick not provided.');
    return;
  }

  res.cookie('irc_nick', req.body.irc_nick, { domain: config.domain });
  res.cookie('area', req.body.area, { domain: config.domain });

  res.render('partials/ircOutput', locals, function(err, result) {
    if (err) {
      console.log('Error processing input! ' + err);
    }
    result = truncateResult(result);

    ircHandler.publishToChannels(result, function () {
      fs.writeFile(config.members_dir + "/" + req.body.irc_nick, result, function(err) {
        console.log("Logged " + req.body.irc_nick + "'s standup.");
      });
    });
    saveStatsRow(req.body.irc_nick, finished, inProgress, impediments,
           function(err, lastID) {
             saveStatusRows(lastID, locals, function(err) {
               res.cookie('lastID', lastID, { domain: config.domain });
               res.send("<pre>\n" + result + "\n</pre>");
             });
           });
  });
});

// trim each line to 500 characters max
function truncateResult(result) {
  var htmlLines = result.split('\n'),
      neededTruncate = false;

  for (var i=0; i < htmlLines.length; i++) {
    if (htmlLines[i].length >= 500) {
      htmlLines[i] = htmlLines[i].slice(0, 497) + '...';
      neededTruncate = true;
    }
  }
  if (neededTruncate) {
    result = htmlLines.join('\n');
  }
  return result
}


// save a row to the db for each status message in a standup
function saveStatusRows(lastID, locals, callback) {
  var now = new Date().getTime();
  statuses = [];
  for (var state of STATES) {
    // for every state, a user can submit multiple tasks with linebreaks
    for (var task of locals[state]) {
      statuses.push({name: locals.irc_nick, time: now, state: state, status: task, stats: lastID});
    }
  }

  knex('statuses').insert(statuses).then(function() {
    callback();
  }).catch(function(err) {
    callback(err);
  });
}

function saveStatsRow(name, finished, inprogress, impediments, callback) {
  var now = new Date().getTime();

  knex('stats').insert({name: name, time: now, finished: finished, inprogress: inprogress, impediments: impediments}).then(function() {
    knex('stats').where({name: name, time: now}).first().then(function(stat) {
      callback(null, stat.id);
    }).catch(function(err) {
      callback(err);
    });
  }).catch(function(err) {
    callback(err);
  });
}

function getStatusForID(id, callback) {
  knex('statuses').where({stats: id}).then(function(results) {
    callback(null, results);
  }).catch(function(err) {
    callback(err);
  });
};

process.on('SIGINT', function() {
  console.log("\nGracefully shutting down from SIGINT (Ctrl+C)");

  ircHandler.disconnect();
  knex.destroy();
  process.exit();
});

// Start the server
app.listen(config.web.port);
console.log('Listening on port ' + config.web.port);
