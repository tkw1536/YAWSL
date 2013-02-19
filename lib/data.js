var lib = require('./lib'),
url = require("url");


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
		try{
			var auth = req.headers['authorization'];
			var tmp = auth.split(' ');
			var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
			var plain_auth = buf.toString();
			var creds = plain_auth.split(':');
			authHeaders = {"username":creds[0], "password":creds[1]};
			if(auth == '' || plain_auth == ':'){
				throw 'noHeaders';	
			}
		} catch(e){
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
module.exports = MakeDataObj;
