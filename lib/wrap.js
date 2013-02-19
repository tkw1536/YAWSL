var MakeDataObj = require('./data');
var lib = require('./lib');

module.exports = function(WebServer){
	//Wrap a single function to create a WebServer
	WebServer.wrap = function(data, options){
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
	return WebServer;
};
