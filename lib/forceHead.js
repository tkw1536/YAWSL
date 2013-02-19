var lib = require('./lib');

module.exports = function(WebServer){
	WebServer.forceHead = function(status, headers, data){//force a header
		var data = WebServer.make(data);
		var headers = lib.makeFunction(headers);
		var status = lib.makeFunction(status);
		return WebServer.wrap(function(req, res, dataObj){
			dataObj.responseCode = status(req);
			lib.expand(headers(req), dataObj.responseHeaders);
			return data(req, res, dataObj);
		});
	};
	return WebServer;
};

