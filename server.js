#!/usr/bin/nodejs

"use strict";

var http   = require("http"),
	url    = require("url"),
	path   = require("path"),
	fs     = require("fs"),
	tokens = require("/etc/hotspot/lib/tokens.js"),
	profiles = require("/etc/hotspot/lib/profiles.js"),
	qs     = require("querystring");

var pages = ["blocked", "welcome", "unlocked", "wrongCode", "error"],
	page = {};
pages.forEach(function (pageName) {
	page[pageName] = fs.readFileSync("/etc/hotspot/html/" + pageName + ".htm").toString('utf8');
});
// Since the pages are static, they are loaded in advance.

function exec(command, sudo, callback) {
	// Executes a command, optionally as superuser.

	console.log("Executing", command);
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(error, stdout, stderr);
		})
	}
}

function CraftRmtracker(IP) {
	// Crafts a rmtrack command for an IP

	return 'rmtrack ' + IP;
}

function CraftIptablesUnlocker(item) {
	// Crafts an iptables command to unlock an item

	var cmd = 'iptables -I internet 1 -t mangle -p tcp ';
	if (item.host) {
		cmd += '-d ' + item.host + ' ';
	}
	if (item.port) {
		cmd += '--dport ' + item.port + ' ';
	}
	cmd += '-m mac --mac-source ' + MAC + ' -j RETURN';
	return cmd;
}

function CraftIptablesLocker(item, MAC) {
	// Crafts an iptables command to lock an item

	var cmd = 'iptables -D internet -t mangle -p tcp ';
	if (item.host) {
		cmd += '-d ' + item.host + ' ';
	}
	if (item.port) {
		cmd += '--dport ' + item.port + ' ';
	}
	cmd += '-m mac --mac-source ' + MAC + ' -j RETURN';
	return cmd;
}

function CraftAtScheduler(command, minutes, sudo) {
	// Crafts an "at"-based command to schedule a command

	cmd = 'echo "';
	if (sudo) { cmd += 'sudo '; }
	cmd += command + '" | ';
	if (sudo) { cmd += 'sudo '; }
	cmd += 'at now + ' + minutes + ' minutes';
	return cmd;
}

function UnlockItem(item, IP, MAC, minutes) {
	// Unlocks an item

	exec(CraftIptablesUnlocker(item, MAC), true);
	exec(CraftRmtracker(IP), true);
	if (minutes) {
		cmd = CraftAtScheduler(CraftIptablesLocker(item, MAC), minutes, true);
		exec(cmd);
		cmd = CraftAtScheduler(CraftRmtracker(IP), minutes, true);
		exec(cmd);
	}
}

function UnlockProfile(profile, IP, MAC, minutes) {
	// Unlocks a profile

	profile.forEach(function (item) {
		UnlockItem(item, IP, MAC, minutes);
	});
}

function UnlockProfileFromToken(tokenData, IP, MAC) {
	// Unlocks a profile according to the token data given

	profile = profiles.GetProfile(tokenData.profile);
	UnlockProfile(profile, IP, MAC, tokenData.minutes);
}

function GetPOSTData(request, callback) {
	// Fetches POST data and returns it to the callback function
	// http://stackoverflow.com/a/4310087/1541408

	var body = '';
	request.on('data', function (data) {
		body += data;
		// Too much POST data, kill the connection!
		if (body.length > 1e6) { req.connection.destroy(); }
	});
	request.on('end', function() {
		callback(qs.parse(body));
		// qs.parse converte body in un array di dati
	});
}

function ServeWrongCode(response) {
	// Serves a "you entered the wrong code!" page

	response.end(page.wrongCode);
}

function ServeUnlocked(response, tokenData) {
	// Serves a "navigation unlocked!" page and customizes it according to the token

	html = page.unlocked.replace("$profile", tokenData.profile).replace("$minutes", tokenData.minutes);
	response.end(html);
}

function ServeError(response) {
	// Serves a generic error page

	response.end(page.error);
}

function GetClientData(request, callback) {
	// Gets the IP and the MAC of a client

	var IP = request.connection.remoteAddress;
	exec("arp -an " + IP, true, function(error, stdout, stderr) {
		// At some point in the output the MAC will appear as eg. 01:23:45:67:89:ab
		MAC = stdout.match(/..:..:..:..:..:../);
		callback({ "IP": IP, "MAC": MAC });
	});
}

function ServeUnlocker(response, request) {
	// Serves the unlocker page, i.e. the one that processes the code

	if (request.method == 'POST') {
		GetPOSTData(request, function (POST) {
			var code = POST.code;
			tokens.ReadToken(code, function(err, tokenData) {
				if (err) {
					ServeWrongCode(response);
				} else {
					tokens.DestroyToken(code);
					GetClientData(request, function(clientData) {
						minutes = tokenData.minutes;
						UnlockProfileFromToken(tokenData, clientData.IP, clientData.MAC);
						ServeUnlocked(response, tokenData);
					});
				}
			});
		})
	} else {
		ServeError(response);
	}
}

function ServeWelcome(response) {
	// Serves a "Welcome to the captive portal!" page

	response.end(page.welcome);
}

function ServeCaptive(response, request) {
	// Serves an internal page

	var uri  = url.parse(request.url).pathname;

	console.log('Serving', uri);

	switch (uri) {
		case '/code':
			ServeUnlocker(response, request);
			break;
		default:
			ServeWelcome(response);
			break;
	}
}

function ServeBlocked(response, request) {
	// Serves a "this page is blocked!" page

	console.log('Intercettata richiesta a ' + request.headers.host);
	response.end(page.blocked);
}

function HTTPListener(request, response) {
	// Listens to HTTP requests and serves the appropriate content

	var host = request.headers.host;

	response.writeHead(200, {
		"Content-Type": "text/html",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": 0
	}); // Prevents browsers from caching the content

	if (host != '192.168.254.1') {
		ServeBlocked(response, request);
	} else {
		ServeCaptive(response, request);
	}
}

http.createServer(HTTPListener).listen(80, "192.168.254.1");
console.log("Captive portal running");