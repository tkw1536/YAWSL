var lib = require('./lib');

module.exports = function(WebServer){
	//Make a Webserver from an array of functions. 
	WebServer.make = function(server){//Makes a server from an array of servers
		var servers = lib.flattenArray(lib.makeArguments(arguments));
		if(servers.length == 1){
			if(server._made){return server;}//NO double making
		}
		if(typeof lib.lastMember(servers) != "function"){
			options = servers.pop();	
		} else {
			options = {};	
		}

		servers = servers.map(function(e){return WebServer.wrap(e, options);});

		var madeServer = WebServer.wrap(function(req, res, dataObj){
			var dataObj = dataObj;
			var done = false;
			for(var i=0;i<servers.length;i++){
				if(servers[i](req, res, dataObj) === true){
					done = true;
					break;			
				}
			}
		
			return done;
		});
		madeServer._made = true;
		return madeServer;
	};

	return WebServer;
};
