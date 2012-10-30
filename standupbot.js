/* Pre-req's
  npm install irc
  npm install js-yaml
  npm install express
  npm install fs
*/

// Imports
var express = require('express');
var irc = require('irc');
var fs = require('fs');
var yaml = require('js-yaml');

// Load Configuration
var contents = fs.readFileSync('./conf/custom-config.yaml').toString();
var config = yaml.load(contents).config;    


// Load Configuration Variables
var nick = config.irc.nick;
var user_name = config.irc.user_name;
var real_name = config.irc.real_name;
var server = config.irc.server;
var port = config.irc.port;
var ssl = config.irc.ssl;
var channels_def = [];
{
    a = config.irc.channels.definitions;
    for (var i = 0; i < a.length; i++) {
	if ('password' in a[i]) {
	    channels_def.push(a[i].name + " " + a[i].password);
	}
	else {
	    channels_def.push(a[i].name);
	}
    }    
}
var channels_publish = config.irc.channels.publish;
var channels_remind  = config.irc.channels.remind;
var members = config.members;

// Connect to IRC
var irc = new irc.Client(server, nick,
			 {
			     userName: user_name,
			     realName: real_name,
			     debug: true,
			     showErrors: true,
			     port: port,
			     autoRejoin: true,
			     autoConnect: true,
			     channels: channels_def,
			     secure: ssl,
			     selfSigned: true,
			     certExpired: true,
			     floodProtection: true,
			     floodProtectionDelay: 250,
			     stripColors: false
			 });

// Initiate the web framework
var app = express();
// Enable web framework to parse HTTP params
app.use(express.bodyParser());
// Serve up the static webpages which include the form
app.use('/', express['static']('./www'));
// Handle the API request
app.post('/irc', function(req, res){
	// build the output
	var result = "";
	result += "---------------------------------------\n"
	result += label_and_break_lines
	    ("["+req.body.irc_nick+": "+req.body.area+" completed  ] ", req.body.completed);
	result += label_and_break_lines
	    ("["+req.body.irc_nick+": "+req.body.area+" inprogress ] ", req.body.inprogress);
	result += label_and_break_lines
	    ("["+req.body.irc_nick+": "+req.body.area+" impediments] ", req.body.impediments);
	result += "---------------------------------------\n"

	console.log(result);
	res.send("<pre>\n"+result+"\n</pre>");
	
	for (var i = 0; i < channels_publish.length; i++) {	
	    console.log("publishing to " + channels_publish[i]);
	    irc.say(channels_publish[i], result);
	}
    });

function label_and_break_lines(label, msg) {
    var result = "";
    if (msg == null || msg == "") {
	result = label+"\n";
    }
    else {
	var lines = msg.split("\n");
	for (var i = 0; i < lines.length; i++) {
	    // line break at 480
	    var sublines = lines[i].match(/.{1,480}/g);
	    if (sublines == null) {
		continue;
	    }
	    for (var j = 0; j < sublines.length; j++) {
		result += label + sublines[j] + "\n";
	    }
	}
    }
    return result
}

// Start the server
app.listen(8080);
console.log('Listening on port 8080');
