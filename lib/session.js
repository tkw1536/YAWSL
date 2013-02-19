var lib = require('./lib');

module.exports = function(WebServer){
	WebServer.session = function(init, expires, sessions, data){//Make simple session which keep their value
		var expires = (typeof expires == 'number')?expires:60*60*1000;
		var init = lib.makeFunction(init);
		var data = WebServer.make(data);
		var sessions = lib.defineIfNull(sessions, {});
		var random = function(){return Math.random().toString().split(".")[1];}
		var makeKey = function(){
			var now = (new Date()).getTime().toString();
			return now+"_"+random()+"_"+random();
		};
	
		var cleanSessions = function(){
			var now = (new Date()).getTime();
			for(var key in sessions){
				if(sessions.hasOwnProperty(key)){
					var session = sessions[key];
					if(session.lastAccess + expires < now){
						delete sessions[key];
					}
				}
			}
		}
	
		var getSession = function(key){
			cleanSessions();
			if(sessions.hasOwnProperty(key)){
				return sessions[key];
			} else {
				return false;
			}
		}
	
		return WebServer.wrap(function(req, res, dataObj){
			var mySession = getSession(dataObj.cookies("sessionId"));
			if(mySession == false){
				mySession = {
					"key": makeKey(),
					"value": init(req, dataObj)
				}
			}
			mySession.lastAccess = (new Date()).getTime();
			var myKey = mySession.key;
			sessions[myKey] = mySession;
			dataObj.cookies("sessionId", mySession.key, expires);
			dataObj.session = {
				"key": mySession.key,
				"value": mySession.value,
				"lastAccess": mySession.lastAccess,
				"expire": function(){
					delete sessions[myKey];
				}
			};
			var result = data(req, res, dataObj);
			if(sessions.hasOwnProperty(myKey)){
					sessions[myKey].value = dataObj.session.value;
			};
			return result;
		
		});
	};
	return WebServer;
}
