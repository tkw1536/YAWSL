module.exports = function(WebServer){
	WebServer.provideJS = function(variableName, data){//provide some js
		var dataFunc = (typeof data == 'function')?data:function(){return data;};
		return WebServer.textServer(function(req, dataObj){
			return "var "+variableName+" = "+JSON.stringify(dataFunc(req, dataObj))+";";
		
		}, "text/javascript", 200);
	};
	return WebServer;
};

