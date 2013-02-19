var lib = require('./lib');

module.exports = function(WebServer){
	WebServer.pathLogin = function(validateKey, data, dataNoAuth, options){//A simple login via keys. Use /login/<key> to login; Use /logout to logout. Key is available as data.session.value;
		var validateKey = lib.makeFunction(validateKey);
		var data = WebServer.make(data);
		var dataNoAuth = WebServer.make(dataNoAuth);
		var options = 
		lib.expandIfNot({
			"loginBasePath": "/login",
			"logoutBasePath": "/logout",
			"overwriteSession": true,
		}, lib.defineIfNull(options, {}));
		
		var sessionStore = {};

		var tryExpire = function(req, res, data){try{data.session.expire(); }catch(e){}return false;};
		var makeKey = function(req, data){
			var key = data.path.substring(1);
			return validateKey(key)?key:false;
		
		};

		return WebServer.session(false, undefined, sessionStore, 
			[
				WebServer.subServer(options.loginBasePath, 
						[
							options.overwriteSession?function(req, res, data){
								data.session.value = makeKey(req, data);
								return false;
							}:function(req, res, data){
								if(data.session.value == false){
									data.session.value = makeKey(req, data);
								}
								return false;
							},
							WebServer.forward("../")			
						]
				),
				WebServer.subServer(options.logoutBasePath, 
					[
						tryExpire,
						WebServer.forward("../")
					]
				),
				WebServer.ifServer(
					function(req, data){return data.session.value;},
					data,//session is now available in this one
					[
						tryExpire,dataNoAuth
					]
				)
			]
		);
	}
	return WebServer;
};
