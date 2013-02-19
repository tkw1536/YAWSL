var lib = require('./lib'),
path = require('path'),
fs = require('fs');

module.exports = function(WebServer){
	//WebServer: static
	WebServer.staticServer = function(root, options){
	
		var options = lib.expandIfNot({
			"mimeTypes": {},
			"indexFile": "index.html", //Index files
			"ignore": function(){return false;},//is a file being ignored?
			"404": WebServer.textServer(function(req, dataObj){return "HTTP 404\nRequested URL not found: "+dataObj.path+"\n";}, 404),
			"401": WebServer.textServer(function(req, dataObj){return "HTTP 401\nAccess to requested URL denied: "+dataObj.path+"\n";}, 401),
		}, lib.defineIfNull(options, {}));

		options["404"] = WebServer.make(options["404"]);
		options["401"] = WebServer.make(options["401"]);
	
	
		var root = path.resolve(root);
		var index = options.indexFile;
		var ignoreF = options.ignore;
		var ignore = function(fn)
		{
			return ignoreF(path.relative(root, fn));
		}

		var mimeTypes = lib.expand(
		{//supported mimeTypes
			"html": "text/html",
			"jpeg": "image/jpeg",
			"jpg": "image/jpeg",
			"png": "image/png",
			"js": "text/javascript",
			"css": "text/css"
		}, options.mimeTypes);

		return WebServer.wrap(function(req, res, dataObj){
			var uri = dataObj.path;
			var filename = path.resolve(path.join(root, uri));//resolve absolute filename
			if(lib.isDir(filename)){
				filename = path.join(filename, options.indexFile);
			}
			if(!lib.isIn(filename, root)){//Access denied. We used a .. in the request
				return 	options["401"](req, res, dataObj);	
			}

			fs.exists(filename, function(exists) {
				if(!exists || ignore(filename)) {//Not Found
					return options["404"](req, res, dataObj);
				}
				try{
					var mimeType = mimeTypes[lib.lastMember(path.extname(filename).split("."))];
				} catch(e){
					var mimeType = "text/plain";
				}
				res.writeHead(200, {'Content-Type':mimeType});
				var fileStream = fs.createReadStream(filename);//pump to the client
				fileStream.pipe(res);
			});
			return true;
		});
	};


	return WebServer;
};
