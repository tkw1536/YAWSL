var lib = require("./lib");
module.exports = function(WebServer){
	WebServer.ifServer = function(cond, trueData, falseData){//Is condition true?
		var cond = lib.makeFunction(cond);
		var trueData = WebServer.make(trueData);
		var falseData = WebServer.make(falseData);
		return WebServer.wrap(function(req, res, data){
			if(cond(req, data)){
				return trueData(req, res, data);
			} else {
				return falseData(req, res, data);
			}
		});
	};

	return WebServer;
};
