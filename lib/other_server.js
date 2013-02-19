module.exports = function(WebServer){
	
	WebServer.otherServer = function(server){//forward to another http server instance, which does not have to be listening, not that this always returns true; to overwrite, WebServer.passive. 
		return WebServer.wrap(function(req, res, dataObj){
			server.emit("request", req, res, dataObj);
			return true;
		});
	};

	return WebServer;
}
