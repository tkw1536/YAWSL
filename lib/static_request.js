var lib = require('./lib');

module.exports = function(WebServer){
	WebServer.staticRequest = function(pth, data){//Static Request: Always answer anything within path with the same thing. 
		var data = WebServer.make(data);
		var pth = lib.properPath(pth);
		return WebServer.wrap(function(req, res, dataObj){
			if(dataObj.path == pth){
				data(req, res, dataObj);
				return true;
			} else {return false;}
		});
	};
	return WebServer;
};
