/*
YAWSL - Yet Another Web Server Library for node.js
(c) Tom Wiesing 2013

a simple library for webservers

Compatible with http.createServer

How to use:

Use one of the wrapping functions and pass it to http.createServer. 

A Server is a function. If it returns true it means that it is done with all the processing and no further servers whave to be evaulated. 
All of the functions get a data object as a third argument (after request, response) which has several methods. 
*/


//Dependencies
var http = require('http'),
fs = require('fs'),
url = require('url'),
path = require('path'),
EventEmitter = require('events').EventEmitter;


var lib = {
	"EventFwd": function(source, dest, evts){//Forward the events evts from source to dest. 
		for(var i=0;i<evts.length;i++){
			var event = evts[i];
			source.on(event, function(){
					var args = [event];
					for(var i=0;i<arguments.length;i++){
						args.push(arguments[i]);
					}
					dest.emit.apply(dest, args);		
			});
		}
		return dest;
	},

	"ObjectFwd": function(source, dest, keys){//Forward the properties in keys from source to dest. 
		for(var i=0;i<keys.length;i++){
			var key = keys[i];
			if(typeof source[key] == 'function'){
				var orgFunction = source[key];
				dest[key] = function(){
					return orgFunction.apply(source, arguments);
				};
			} else {
				dest[key] = source[key];
			}
		}
		return dest;
	},
	"ObjForwardAll": function(source, dest){//Forward all properties from source to dest. 
		for(var key in source){
			if(source.hasOwnProperty(key)){
				if(typeof source[key] == 'function'){
					var orgFunction = source[key];
					dest[key] = function(){
						return orgFunction.apply(source, arguments);
					};
				} else {
					dest[key] = source[key];
				}
			}	
		}	
		return dest;
	},
	"makeFunction": function(obj){return (typeof obj == 'function')?obj:function(){return obj;};},//turn an object into a function
	"defineIfNull": function(obj, def){
		return (typeof obj == "undefined")?lib.makeFunction(def)():obj;
	},
	"isArray": function(obj){
		if(Array.isArray(obj)){
			return true;
		}
	},
	"isType": function(obj, type){
		switch(type){
			case "*": return (typeof obj != 'undefined'); //We want to be defined
			case "array": return lib.isArray(obj); break;
			case "number": 	return (typeof obj == 'number'); break;
			case "string": 	return (typeof obj == 'string'); break;
			case "function": 	return (typeof obj == 'function'); break;
			case "bool": 	return (typeof obj == 'boolean'); break;
			case "hash": 	return (typeof obj == 'object'); break;
			default: return false;
		}			
	},
	"getType": function(obj){
		switch(typeof obj){
			case "number": return "number"; break;
			case "string": return "string"; break;
			case "boolean": return "boolean"; break;
			case "function": return "function"; break;
			case "undefined": return "undefined"; break;
			default: return lib.isArray(obj)?"array":"hash";	
		}	
	},
	"makeArguments": function(args, types, defaults){
		//Supported types = "number", "string", "bool", "array", "hash", "function", "*"
		var results = [];
		var types = lib.defineIfNull(types, []);
		var defaults = lib.defineIfNull(defaults, []);
		var i = 0;
		var j = 0;	
		for(;i<types.length;i++){
			if(args.length>i){
				if(lib.isType(args[i], types[i])){
					results.push(args[i]);
				} else {
					results.push(defaults[i]);
				}	
			}
		}
		for(;i<args.length;i++){
			results.push(args[i]);
		}
		return results;
	},
	"expand": function(source, dest, keepTypes, mayAdd){
		var dest = lib.defineIfNull(dest, {});
		var keepTypes = (typeof keepTypes == "boolean")?keepTypes:true;
		var mayAdd = (typeof mayAdd == "boolean")?mayAdd:true;
		for(var key in source){
			if(source.hasOwnProperty(key)){
				if(keepTypes){
					if(dest.hasOwnProperty(key)){
						if(keepTypes){
							if(lib.getType(source[key]) == lib.getType(dest[key])){
								dest[key] = source[key];
							}
						} else {
							dest[key] = source[key];
						}					
					} else if(mayAdd){
						dest[key] = source[key];
					}			
				}
			}		
		}
		return dest;
	},
	"expandIfNot": function(source, dest){
		for(var key in source){
			if(source.hasOwnProperty(key) && !dest.hasOwnProperty(key)){
				dest[key] = source[key];
			}
		}
		return dest;
	},
	"flattenArray": function(arr){
		var result = [];		
		for(var i=0;i<arr.length;i++){
			if(lib.isArray(arr[i])){
				result.push.apply(result, lib.flattenArray(arr[i]));			
			} else {
				result.push(arr[i]);			
			}
		}
		return result;
	},
	"properPath": function(pth){
		lib.defineIfNull(url.parse(pth).pathname, "");
		return lib.startsWith(pth, '/')?pth:'/'+pth;	
	},
	"startsWith": function(/* string */ y, /* string */ x){//Does y start with x
		var x = x.split("");//make arrays
		var y = y.split("");
		while(true){
			if(x.length == 0){return true;}//is x==[]? then we are done 
			if(x.shift() != y.shift()){ return false};//Two chars are not equal => false
		}	
	},
	"endsWith": function(/* string */ y, /* string */ x){//Does y end with x
		var x = x.split("");//make arrays
		var y = y.split("");
		while(true){
			if(x.length == 0){return true;}//is x==[]? then we are done 
			if(x.pop() != y.pop()){ return false};//Two chars are not equal => false
		}	
	},
	"isIn": function(query, basePath){
		var query = path.normalize(path.resolve(query));
		var base = path.normalize(path.resolve(basePath));
		return (lib.startsWith(query, base));//If we start with .., we go back and are not inside
	},
	"lastMember": function(/* array */ x){return x[x.length - 1];},//returns the last member of an array
	"isDir": function(d) {
	  try { return fs.statSync(d).isDirectory() }
	  catch (e) { return false }
	},

	"isFile": function(d) {
	  try { return fs.statSync(d).isFile() }
	  catch (e) { return false }
	}
}
var MakeDataObj = function(req, res, dataObj, options){
	lib.expandIfNot({
		"responseHeaders": {}, /* Forcing response Headers */
		"responseCode": false, /* Forcing response Code */
		"responseText": false, /* force a status text */
		"errors": [], /* Errors */
		"cookies":{}, /* Cookies */
		"session": false, /* Session */
		"options": options, /* Options */
		"basePath": "/"
	}, dataObj);
	

	/* Cookies */
	var cookies = function(param, value){
		var now = (new Date()).getTime();
		if(typeof value == 'undefined'){
			var cookie = cookies.all[param];
			if(typeof cookie != "undefined"){
				var expires = cookie.options.expires;
				return cookie.value;
			}
		} else {
			var value = lib.makeFunction(value);
			var expires = 0;
			if(typeof options == 'number'){
				expires = options;
				delete options;
			}
			expires = (expires>0)?expires.now:expires;
			options = (typeof options == 'undefined')?{}:options;
			var path = lib.defineIfNull(options["path"], "/");
			var domain = lib.defineIfNull(options["domain"], false);
			cookies.all[param] = {
				"name":param, 
				"value": value(cookies(param)), 
				"options": {
					"path": path,
					"domain": domain,
					"expires": expires,
					"noSend": false
				}
			};
		}
	};
	cookies.all = lib.defineIfNull(dataObj.cookies.all, {});
	req.headers = lib.defineIfNull(req.headers, {});
	if(req.headers.cookie){
		req.headers.cookie.split(';').forEach(function( cookie ) {
			var parts = cookie.split('=');
			var name = parts[0].trim();
			var value = (parts[ 1 ] || '' ).trim();
			if(!cookies.all.hasOwnProperty(name)){
				try{
					value = JSON.parse(unescape(value));
				} catch(e){
				}
				cookies.all[name] = {
					"name":name, 
					"value": value, 
					"options": {
						"noSend": true
					}
				};
			}
		});
	}
	/* Authorisation Basic */
	var authHeaders;
	if(req.headers['authorization']){
		var auth = req.headers['authorization'];
		var tmp = auth.split(' ');
		var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
		var plain_auth = buf.toString();
		var creds = plain_auth.split(':');
		authHeaders = {"username":creds[0], "password":creds[1]};
		if(auth == '' || plain_auth == ':'){
			authHeaders = false;	
		}
	} else {
		authHeaders = false;
	}
	
	/* Take it all */
	dataObj.referer = lib.defineIfNull(req.headers['referer'], "") /* Referer */
	dataObj.cookies = cookies;
	dataObj.basicAuth = authHeaders; /* Authorisation basic */
	dataObj._originals = {"request": req, "response": res};
	dataObj.url = url.parse(req.url, true); 
	dataObj.path = lib.properPath(dataObj.url.pathname);

	/* Modified write Head */
	var orgHead = res.writeHead;
	
	res.writeHead = function(statusCode, reasonPhrase, headers){
		var cookieJar = [];
		for(var key in cookies.all){
			if(cookies.all.hasOwnProperty(key)){
				var cookie = cookies.all[key];
				if(cookie.options.noSend){
					continue;				
				}
				var expiresDate = new Date(cookie.options.expires).toUTCString();
				var cookieString = cookie.name+"="+escape(JSON.stringify(cookie.value))
				if(cookie.options.expires != 0){
					cookieString += "; expires="+expiresDate;
				}
				if(cookie.options.path){
					cookieString += "; path=" + cookie.options.path;
				}
				if(cookie.options.domain){
					cookieString += "; domain="+domain;
				}
				cookieJar.push(cookieString);
				
			}		
		}
		dataObj.responseHeaders['Set-Cookie'] = cookieJar;
		var args = [statusCode];
		if(typeof reasonPhrase == 'string'){
			args.push(reasonPhrase);
			args.push(lib.defineIfNull(headers, {}));
		} else {
			args.push("");
			args.push(lib.defineIfNull(reasonPhrase, {}));
		}
		args[2] = lib.expandIfNot(args[2], dataObj.responseHeaders);
		if(typeof dataObj.responseCode == 'number'){
			args[0] = dataObj.responseCode;	
		}
		if(typeof dataObj.responseText == 'string'){
			args[1] = dataObj.responseText;		
		}
		return orgHead.apply(this, args);
	};

	return dataObj;
};

var WebServer = function(){
	return http.createServer(WebServer.make.apply(this, arguments));/* Create a server but do not start to listen. */
}

WebServer.wrap = function(data, options){//Wraps a WebServer
	if(typeof data != 'function'){
		throw new Error("Server is not a function, must be a function. ");
	}
	if(data._wrapped){return data;}//No double wrapping
	var dataFunc = function(){/* Wrap the Function */
		var args = lib.makeArguments(arguments);
		args[2] = MakeDataObj(args[0], args[1], (typeof args[2] == 'undefined')?{}:args[2], options);
		return data.apply(this, args);
	};
	dataFunc._wrapped = true;
	dataFunc._original = data;
	return dataFunc;
};

WebServer.make = function(server){//Makes a server from an array of servers
	var servers = lib.flattenArray(lib.makeArguments(arguments));
	if(servers.length == 1){
		if(server._made){return server;}//NO double making
	}
	if(typeof lib.lastMember(servers) != "function"){
		options = servers.pop();	
	} else {
		options = {};	
	}

	servers = servers.map(function(e){return WebServer.wrap(e, options);});

	var madeServer = WebServer.wrap(function(req, res, dataObj){
		var dataObj = dataObj;
		var done = false;
		for(var i=0;i<servers.length;i++){
			if(servers[i](req, res, dataObj) === true){
				done = true;
				break;			
			}
		}
		
		return done;
	});
	madeServer._made = true;
	return madeServer;
}


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

WebServer.staticRequest = function(pth, data){//Static Request: Always answer anything within path with the same thing. 
	var data = WebServer.make(data);
	var pth = lib.properPath(pth);
	return WebServer.wrap(function(req, res, dataObj){
		if(dataObj.path == pth){
			data(req, res, dataObj);
			return true;
		} else {return false;}
	});
};

WebServer.echoServer = function(){//An echo server, sends headers back
	return WebServer.wrap(function(req, res, data){
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write(require("util").inspect(req.headers));
		res.end();
		return true;
	});
};

WebServer.passive = function(data){//do something passive, always continue after it. 
	var data = WebServer.make(data);
	return WebServer.wrap(function(req, res, dataObj){
		data(req, res, dataObj);
		return false;
	});
};

WebServer.active = function(data){//do something active, always abort after it. 
	var data = WebServer.make(data);
	return WebServer.wrap(function(req, res, dataObj){
		data(req, res, dataObj);
		return true;
	});
};

WebServer.handled = function(data, fallback){//try ... [catch ...]
	if(typeof fallback == 'undefined'){
		fallback = function(){return false;}
	}
	var data = WebServer.make(data);
	var fallback = WebServer.make(fallback);
	return WebServer.wrap(function(req, res, dataObj){
		var res;
		try{
			return data(req, res, dataObj);	
		} catch(e){
			dataObj.errors.push(e);
			return fallback(req, res, dataObj);	
		}
	});
}

WebServer.nullServer = function(status){//Do absolutely nothing
	return WebServer.textServer("", "text/plain", status);
}

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
		res.writeHead(status(req), {'Content-Type': mimeType(req)});
		res.write(text(req, dataObj));
		res.end();
		return true;
	});
}

WebServer.otherServer = function(server){//forward to another http server instance, which does not have to be listening, not that this always returns true; to overwrite, WebServer.passive. 
	return WebServer.wrap(function(req, res, dataObj){
		server.emit("request", req, res, dataObj);
		return true;
	});
};

WebServer.post = function(data){//Answer only requests with post method
	var data = WebServer.make(data);
	return WebServer.wrap(function(req, res, dataObj){
		if(req.method == 'POST'){
			return data(req, res, dataObj);
		} else {
			return false;		
		}
	});
}

WebServer.get = function(data){//Answer only requests with get method
	var data = WebServer.make(data);
	return WebServer.wrap(function(req, res, dataObj){
		if(req.method == 'GET'){
			return data(req, res, dataObj);
		} else {
			return false;		
		}
	});
}

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

WebServer.forward = function(to, data){//forward somewhere else
	var to = lib.makeFunction(to);
	if(typeof data == 'undefined'){
		data = WebServer.nullServer();	
	}
	var data = WebServer.make(data);
	return WebServer.forceHead(302, function(req){return {'Location': to(req)};}, data);
};

WebServer.basicAuth = function(realmName, authHandler, data, dataUnauthed){
	var data = WebServer.make(data);
	var dataUnauthed = (typeof dataUnauthed != 'undefined')?dataUnauthed:WebServer.textServer('HTTP 401 Unautharised');
	var unAuthorised = WebServer.forceHead(401, {"WWW-Authenticate": 'Basic realm="'+realmName+'"'}, dataUnauthed);
	return WebServer.wrap(function(req, res, dataObj){
		var authData = dataObj.basicAuth;
		if(authData !== false){
			if(authHandler(authData["username"], authData["password"])){
				data(req, res, dataObj);
			} else {
				unAuthorised(req, res, dataObj);
			}
		} else {
			unAuthorised(req, res, dataObj);
		}
		return true;
	});
};

WebServer.provideJS = function(variableName, data){//provide some js
	var dataFunc = (typeof data == 'function')?data:function(){return data;};
	return WebServer.textServer(function(req, dataObj){
		return "var "+variableName+" = "+JSON.stringify(dataFunc(req, dataObj))+";";
		
	}, "text/javascript", 200);
};

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

module.exports = WebServer;
