module.exports = function(WebServer){
	WebServer.handled = function(data, fallback){//try ... [catch ...]
		if(typeof fallback == 'undefined'){
			fallback = function(){return false;}
		}
		var data = WebServer.make(data);
		var fallback = WebServer.make(fallback);
		return WebServer.wrap(function(req, res, dataObj){
			var res;
			try{
				return data(req, res, dataObj);	
			} catch(e){
				dataObj.errors.push(e);
				return fallback(req, res, dataObj);	
			}
		});
	}
	return WebServer;
}
