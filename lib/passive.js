module.exports = function(WebServer){
	WebServer.passive = function(data){//do something passive, always continue after it. 
		var data = WebServer.make(data);
		return WebServer.wrap(function(req, res, dataObj){
			data(req, res, dataObj);
			return false;
		});
	};

	return WebServer;
}
