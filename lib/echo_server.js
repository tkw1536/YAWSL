module.exports = function(WebServer){

	WebServer.echoServer = function(){//An echo server, sends headers back
		return WebServer.wrap(function(req, res, data){
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write(require("util").inspect(req.headers));
			res.end();
			return true;
		});
	};

	return WebServer;
}
