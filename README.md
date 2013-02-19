# YAWSL
Yet another web server library for node.js. 

(c) Tom Wiesing 2013

It is compatible with `http.createServer`. 

You can use it for example like this: 

	var yawsl = require('yawsl');
	http.createServer(yawsl.echoServer()).listen(80);

This will create a simple server that echoes back the request it receives. 

## YAWSL Functions
YAWSL returns functions which can be used directly with `http.createServer` (or `https.createServer` ). You can simple make a YAWSL function like this: 

	yawsl.make(
		function(req, res, data){
			/* Your awesome code here */
		}
	);

The `req` and `res` objects are instances of `http.ServerRequest` and `http.ServerResponse` respectively. 
data is a special object created by YAWSL. It simplifies several steps you may want to do when having a webserver. 

* `data.responseHeaders` is an array of headers that will added when responding to the request. 
* `data.responseCode` if not false is an integer that will be used as a response code. 
* `data.responseText` if not false is a string that will be used a response status text. 
* `data.errors` is an array that contains all errors occured. Will not be passed to the client. 
* `data.cookies(name,[value]`) returns or sets a cookies. 
* `data.cookies.all` is an array containing all cookies. Verey cookie can be changed. Note that they will be encoded in JSON. `data.cookies.all[name].options.expires = -1` expires a cookie. 
* `data.session` is either false or contains session information, see `yawsl.session()`.
* `data.options` is a hash containing options used to parse request an dresponse options to create the properties above. There is currently no way to change this before creating this object. 
* `data.basePath` the base request path of the current request. 
* `data.referer` the referer of the request or an empty string. 
* `data.basicAuth` basic authentication header containing `{'username': /* .. */, 'password': /* .. */}` or false if not available. 
* `data._originals` contains the original request and response object associated with this data object. 
* `data.url` contains the parsed url of the request, see node documentation url.parse. 
* `data.path` contains the path of the current request. 

You can also create an array of response objects by passing them to `yawsl.make` like so: 

	yawsl.make(
		[
			function(req, res, data){
				/* Your awesome code here */
			},
			function(req, res, data){
				/* more of your coding skills can be used here */
			}		
		]
	);

When passing this to `http.createServer`, the first function will be executed. If it returns true, the request will be considered as answered. If it does not, the second will be executed. This  will continue either until one function returns true or the entire array has been checked. Note that any arguments passed to `yawsl.make` will be flattened, so if you pass two arrays to it, yawsl will first go through the first array and then through the second as if they were one array. 

When using any other YAWSL functionality YAWSL will automatically pass simple functions or arrays to `yawsl.make` so that you do not always have to do this manually. In the following documentation, any function array or created function will be refered to as YAWSLObject. 

## Functionality
In addition to this way of easily creating servers, YAWSL offers several functionality to simplify common tasks. 

### Core
* `yawsl(YAWSLObject)` return an instance of `http.Server` which  answers to a request with the specefied  YAWSLObject. 
* `yawsl.wrap(ListenerFunction)` wraps a simple function create a YAWSLObject. 
* `yawsl.make(Listener1, Listener2, ...)` creates a YAWSLObject object, see YAWSL Functions above. 

### Simple Branching
* `yawsl.ifServer(condition, YAWSLObjectTrue, YAWSLObjectFalse`) checks if the function `condition(req, data)` is true or false. If true, calls YAWSLObjectTrue else YAWSLObjectFalse. 
* `yawsl.active(YAWSLObject)` calls YAWSLObject, ignores the result and end request. 
* `yawsl.passive(YAWSLObject)` calls YAWSLObject, ignores the result and continues. Useful for debugging. 
* `yawsl.get(YAWSLObject)` responds to GET requests only. 
* `yawsl.post(YAWSLObject)` responds to POST requests only. 
* `yawsl.handled(YAWSLObject, YAWSLObjectFallBack)` tries to call YAWSLObject. If an unhandled exception occurs, YAWSLObjectFallBack will be called. 

### Simple Servers
* `yawsl.nullServer()` responds to every request with an empty text/plain string. 
* `yawsl.textServer(text, [mimeType = 200], status)` responds to every request with the specefied text, mimeType and status. text, mimeType, status may be functions depending on the request and data.
* `yawsl.echoServer()` responds to every request by echoing the request headers. 

### Advanced Branching
* `yawsl.subServer(subServerRoot, YAWSLObject)` creates a YAWSLObject which answers every request in subServerRoot with the server YAWSLObject. Not ethat the path of the request will be changed to match the new root path. 
* `yawsl.staticRequest(path, YAWSLObject)` always answer a request to path with YAWSLObject. 
* `yawsl.otherServer(httpServerObj)` responds to every request as if the specefied httpServerObj would answer it. Note that the server does not have to be listening. 

### Header / data object extensions
* `yawsl.forceHead(code, headers, YAWSLObject)` forces any response in YAWSLObject to answer with the specefied code and headers. 
* `yawsl.forward(to, YAWSLObject)` forwards every request to the specefied path. The Body of the response will be determined by YAWSLObject. 
* `yawsl.session(createNewObject, expires, sessionStoreObject, YAWSLObject)` Enabled sessions in the data object. A session expires after `expires` milliseconds. The `sessionStoreObject` must be an initially empty object which is shared over all session request to store session. YAWSLObject will have the property data.session with the following properties: 
	* `session.key` unique key of the session. 
	* `session.value` an object containing some value which is copied from session to session. Intially created by `createNewObject(req, data)`
	* `session.lastAccess` integer containing the last access to the session. 
	* `session.expire()` function to expire the session immediatly. 

### File Handling
* `yawsl.file(fileName, mimeType, status)` reads file and passes it to the client with the specefied mimeType and status. fileName, mimeType, status may be functions depending on the request and data.  object of the request. 
* `yawsl.staticServer(fileRoot, options)` creates a static file server which server files from fileRoot. Options is a hash which may contain the following options: 
	* `options.mimeTypes`: map from file extension to file types. 
	* `options.indexFile`: The index File to server when a directory is requested. Default: 'index.html'
	* `options.ignore`: Function which is called to check if a filename is forbidden. Default: `function(filename){return false;}`
	* `options.404`: YAWSLObject to be called when an object is not found. 
	* `options.404`: YAWSLObject to be called when access to an object is forbidden. 


### Authorisation
* `yawsl.basicAuth(realmName, authHandler, YAWSLObject, YAWSLObjectNoAuth)` Creates a simple HTTP Basic authentication protected area. `realmName` is the name of the realm, `authHandler` is a function of username and password which validates a user/password combination. YAWSLObject will be called if the authentication succedes and YAWSLObjectNoAuth otherwise. 
* `yawsl.pathLogin(...)`  undocumented. 


### Misc
* `yawsl.provideJS(ClientVariableName, JSObject)` provides a javascript object to the client as variableName. 


##License
		    DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
		            Version 2, December 2004

	 Copyright (C) 2013 Tom Wiesing <tkw01536@gmail.com>

	 Everyone is permitted to copy and distribute verbatim or modified
	 copies of this license document, and changing it is allowed as long
	 as the name is changed.

		    DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
	   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

	  0. You just DO WHAT THE FUCK YOU WANT TO.
