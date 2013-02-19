module.exports = function(WebServer){
	WebServer.post = function(data){//Answer only requests with post method
		var data = WebServer.make(data);
		return WebServer.wrap(function(req, res, dataObj){
			if(req.method == 'POST'){
				return data(req, res, dataObj);
			} else {
				return false;		
			}
		});
	}
	return WebServer;
};
