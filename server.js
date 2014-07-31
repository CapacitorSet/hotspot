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

profiles = JSON.parse(fs.readFileSync('profiles.json').toString("utf8"));

http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname,
		ip = request.connection.remoteAddress;
	response.writeHead(200, {"Content-Type": "text/html"});
	if (request.headers.host != '192.168.254.1') {
		response.write('Per navigare devi fare il login!<br><a href="http://192.168.254.1">Vai alla pagina principale</a>');
	} else if (uri == "/unlock.htm") {
		profile = require('url').parse(request.url, true).query['profile'];
		profile = profiles[profile]; // deal with it
		profile.forEach(function (item) {
			exec("sudo arp -an " + ip, function(error, stdout, stderr) {
				mac = stdout.match(/..:..:..:..:..:../);
				console.log(stdout, mac);
				exec('iptables -I internet 1 -t mangle -p tcp -d ' + item.host + ' --dport ' + item.port + ' -m mac --mac-source ' + mac + ' -j RETURN');
				exec('sudo rmtrack ' + ip, function(error, stdout, stderr) {
					console.log(stdout);
				});
		});

		})
	} else {
		response.write('Benvenuto al captive portal!');
		for(var profile in profiles) {
			console.log(profile);
			response.write('<br><a href="unlock.htm?profile=' + profile + '">Sblocca ' + profile + '</a>');
		}
	}
	response.end();
	console.log(uri);
}).listen(80);
