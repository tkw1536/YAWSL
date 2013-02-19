/* Library Functions */
var EventEmitter = require('events').EventEmitter,
url = require('url'),
fs = require('fs'),
path = require("path");

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

module.exports = lib;
