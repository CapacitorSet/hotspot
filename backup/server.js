#!/usr/bin/nodejs
var http = require("http"),
url = require("url"),
path = require("path"),
fs = require("fs");

function exec(command, callback) {
	console.log("Executing", command)
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(stdout);
		})
	}
}

http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname,
		ip = request.connection.remoteAddress;
	response.writeHead(200, {"Content-Type": "text/html"});
	if (request.headers.host != '192.168.254.1') {
		response.write('Per navigare devi fare il login!<br><a href="http://192.168.254.1">Vai alla pagina principale</a>');
	} else if (uri == "/unlock.htm") {
		exec("sudo arp -an " + ip, function(error, stdout, stderr) {
			mac = stdout.match(/..:..:..:..:..:../);
			console.log(stdout, mac);
			exec('sudo iptables -I internet 1 -t mangle -m mac --mac-source ' + mac + ' -j RETURN', function(error, stdout, stderr) {
				console.log(stdout);
			});
			exec('sudo rmtrack ' + ip, function(error, stdout, stderr) {
				console.log(stdout);
			});
		})
	} else if (uri == "/unlockcompitigratis.htm") {
		console.log('a')
		exec("sudo arp -an " + ip, function(error, stdout, stderr) {
			mac = stdout.match(/..:..:..:..:..:../);
			console.log(stdout, mac);
			exec('iptables -I internet 1 -t mangle -p tcp -d compitigratis.it --dport 80 -m mac --mac-source ' + mac + ' -j RETURN');
			exec('sudo rmtrack ' + ip, function(error, stdout, stderr) {
				console.log(stdout);
			});
		});
	} else {
		response.write('Benvenuto al captive portal!<br><a href="unlock.htm">Sblocca tutto</a><br><a href="unlockcompitigratis.htm">Sblocca compitigratis</a>');
	}
	response.end();
	console.log(uri);
}).listen(80);
