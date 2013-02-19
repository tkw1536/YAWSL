module.exports = function(WebServer){
	WebServer.active = function(data){//do something active, always abort after it. 
		var data = WebServer.make(data);
		return WebServer.wrap(function(req, res, dataObj){
			data(req, res, dataObj);
			return true;
		});
	};
	return WebServer;
}
