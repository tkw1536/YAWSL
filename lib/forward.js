var lib = require('./lib');

module.exports = function(WebServer){
	WebServer.forward = function(to, data){//forward somewhere else
		var to = lib.makeFunction(to);
		if(typeof data == 'undefined'){
			data = WebServer.nullServer();	
		}
		var data = WebServer.make(data);
		return WebServer.forceHead(302, function(req){return {'Location': to(req)};}, data);
	};
	return WebServer;
};
