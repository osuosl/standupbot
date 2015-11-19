// load members from configuration file
var yaml = require("js-yaml");
var fs = require("fs");
var m = yaml.load(fs.readFileSync("conf/custom-config.yaml")).config.members;

exports.seed = function(knex, Promise) {
  var a = [];
  
  // Insert members from config file
  for(var i=0; i<m.length; i++) {
	a.push({id: i+1, nick: m[i], real_name: m[i] + "_realname"});
  }

  return knex('users').insert(a);
};
