module.exports = function(WebServer){
	WebServer.nullServer = function(status){//Do absolutely nothing
		return WebServer.textServer("", "text/plain", status);
	}
	return WebServer;
}
