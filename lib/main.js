/*
YAWSL - Yet Another Web Server Library for node.js

This program is free software. It comes without any warranty, to
the extent permitted by applicable law. You can redistribute it
and/or modify it under the terms of the Do What The Fuck You Want
To Public License, Version 2, as published by Sam Hocevar. See
http://www.wtfpl.net/ for more details. 
*/


//Dependencies
var http = require('http');

var WebServer = function(){
	return http.createServer(WebServer.make.apply(this, arguments));/* Create a server but do not start to listen. */
}

/* load packages */

var Packages = [
	/* core */
	'make', 
	'wrap', 

	/* core branching */
	'if',
	'active',
	'passive',
	'get',
	'post',
	'handled',

	/* simple */
	'null_server',
	'text_server',
	'echo_server',

	/* adv branching */
	'subserver', 
	'static_request',
	'other_server',

	/* header extensions */
	'forceHead',
	'forward',
	'session',

	/* files */
	'file', 
	'static_server',
	
	/* auth */
	'basic_auth',
	'auth_path',
	

	/* misc */
	'provide_js'
	
];

for(var i=0;i<Packages.length;i++){
	var pack = require('./'+Packages[i]);
	WebServer = pack(WebServer);
}

module.exports = WebServer;
