module.exports = function(WebServer){
	WebServer.basicAuth = function(realmName, authHandler, data, dataUnauthed){
		var data = WebServer.make(data);
		var dataUnauthed = (typeof dataUnauthed != 'undefined')?dataUnauthed:WebServer.textServer('HTTP 401 Unautharised');
		var unAuthorised = WebServer.forceHead(401, {"WWW-Authenticate": 'Basic realm="'+realmName+'"'}, dataUnauthed);
		return WebServer.wrap(function(req, res, dataObj){
			var authData = dataObj.basicAuth;
			if(authData !== false){
				if(authHandler(authData["username"], authData["password"])){
					data(req, res, dataObj);
				} else {
					unAuthorised(req, res, dataObj);
				}
			} else {
				unAuthorised(req, res, dataObj);
			}
			return true;
		});
	};
	return WebServer;
};

