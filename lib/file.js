var fs = require("fs"),
path = require("path"),
lib = require("./lib");


module.exports = function(WebServer){
	WebServer.file = function(file, mimeType, status){//Provide a file
		mimeType = lib.defineIfNull(mimeType, "text/plain");
		status = lib.defineIfNull(status, 200);
		var file = lib.makeFunction(file),
		mimeType = lib.makeFunction(mimeType),
		status = lib.makeFunction(status);

		return WebServer.wrap(WebServer.handled(
			function(req, res, data){
				res.writeHead(status(req, data), {'Content-Type': mimeType(req, data)});
				var fileStream = fs.createReadStream(path.resolve(file(req, data)));//pump to the client
				fileStream.pipe(res);
				return true;
			},
			function(){
				return false;		
			}
		));
	};
	return WebServer;
}
