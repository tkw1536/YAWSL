var lib = require("./lib");

module.exports = function(WebServer){
	WebServer.textServer = function(text, mimeType, status){//provide some text
		if(typeof mimeType == 'number'){
			mimeType = undefined;
			status = mimeType;
		}
		mimeType = lib.defineIfNull(mimeType, "text/plain");
		status = lib.defineIfNull(status, 200);
		var text = lib.makeFunction(text),
		mimeType = lib.makeFunction(mimeType),
		status = lib.makeFunction(status);

		return WebServer.wrap(function(req, res, dataObj){
			res.writeHead(status(req, dataObj), {'Content-Type': mimeType(req, dataObj)});
			res.write(text(req, dataObj));
			res.end();
			return true;
		});
	}
	return WebServer;
}
