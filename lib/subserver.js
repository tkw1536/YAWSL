var lib = require('./lib'),
path = require('path'),
url = require('url'),
MakeDataObj = require('./data');

module.exports = function(WebServer){
	//Subserver
	WebServer.subServer = function(requestRoot, data){//Create a SubServer in the path requestRoot, all other
		var requestRoot = lib.properPath(requestRoot);
		var data = WebServer.make(data);
		return WebServer.wrap(function(req, res, dataObj){
			if(lib.isIn(dataObj.path, requestRoot)){//Are we in  the root
				var reqUrl = url.parse(req.url)
				reqUrl = path.relative(requestRoot, lib.defineIfNull(reqUrl.pathname, ""));
				reqUrl = url.format(reqUrl);
				reqUrl = lib.startsWith(reqUrl, '/')?reqUrl:'/'+reqUrl;
				req.url = reqUrl;
				dataObj.basePath = path.join(dataObj.basePath, requestRoot);
				return data(req, res, MakeDataObj(req, res, dataObj));
			} else {return false;}
		});
	};

	return WebServer;
};
