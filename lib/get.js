module.exports = function(WebServer){
	WebServer.get = function(data){//Answer only requests with get method
		var data = WebServer.make(data);
		return WebServer.wrap(function(req, res, dataObj){
			if(req.method == 'GET'){
				return data(req, res, dataObj);
			} else {
				return false;		
			}
		});
	}
	return WebServer;
};
