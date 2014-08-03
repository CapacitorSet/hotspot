#!/usr/bin/nodejs
var http   = require("http"),
url    = require("url"),
path   = require("path"),
fs     = require("fs"),
tokens = require("/etc/hotspot/lib/tokens.js"),
profiles = require("/etc/hotspot/lib/profiles.js")
qs     = require("querystring");

function exec(command, sudo, callback) {
	console.log("Executing", command);
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(error, stdout, stderr);
			if (error) {
				console.log('Command:', command);
			}
		})
	}
}

function GetClientData(request, callback) {
	console.log('Client data asked for')
	// Gets the IP and the MAC of a client
	var IP = request.connection.remoteAddress;
	console.log('IP gotten')
	exec("arp -an " + IP, true, function(error, stdout, stderr) {
		console.log('MAC gotten')
		// At some point in the output the MAC will appear as eg. 01:23:45:67:89:ab
		MAC = stdout.match(/..:..:..:..:..:../);
		callback({ "IP": IP, "MAC": MAC });
	});
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

function CraftIptablesUnlocker(item) {
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

function CraftRmtracker(IP) {
	return 'rmtrack ' + IP;
}

function UnlockProfileFromToken(tokenData, IP, MAC) {
	profile = profiles.GetProfile(tokenData.profile);
	UnlockProfile(profile, IP, MAC, tokenData.minutes);
}

function UnlockProfile(profile, IP, MAC, minutes) {
	profile.forEach(function (item) {
		UnlockItem(item, IP, MAC, minutes);
	});
}

function UnlockItem(item, IP, MAC, minutes) {
	exec(CraftIptablesUnlocker(item, MAC), true);
	exec(CraftRmtracker(IP), true);
	if (minutes) {
		cmd = CraftAtScheduler(CraftIptablesLocker(item, MAC), minutes, true);
		exec(cmd);
		cmd = CraftAtScheduler(CraftRmtracker(IP), minutes, true);
		exec(cmd);
	}
}

function ServeBlockedPage(request, response) {
	// Serves a "this page is blocked!" page
	console.log('Intercettata richiesta a ' + request.headers.host);
	response.end('Questa pagina &egrave; bloccata! Se hai un account, clicca <a href="http://192.168.254.1">qui</a> per sbloccare l\'accesso a Internet.');
}

function GetPOSTData(request, callback) {
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

function ServeUnlocker(request, response) {
	// Parse POST data. http://stackoverflow.com/a/4310087/1541408
	console.log('Serving the unlocker');
	if (request.method == 'POST') {
		console.log('The method is correct! Waiting to receive POST data.');
		GetPOSTData(request, function (POST) {
			code = POST.code;
			console.log('POST data received:', POST);
			console.log('Waiting to read the token with code',code);
			tokens.ReadToken(code, function(err, tokenData) {
				console.log('Token read! Parameters:',err,tokenData);
				if (err) {
					response.end("Si &egrave; verificato un errore!");
				} else {
					console.log('Destroying the token')
					tokens.DestroyToken(code);
					console.log('Token destroyed! Waiting to get client data')
					GetClientData(request, function(clientData) {
						console.log('Client data gotten:',clientData);
						minutes = tokenData.minutes;
						console.log('Unlocking profile from token');
						UnlockProfileFromToken(tokenData, clientData.IP, clientData.MAC);
						console.log('Unlocked');
						today = new Date();
						response.end("Ora puoi navigare per " + minutes + " minuti (fino a " + Date(today.getTime()+minutes * 1440) + ")!");
					});
				}
			});
		})
	} else {
		response.end('Si &egrave; verificato un errore!')
	}
}

function ServeCaptive(request, response) {
	// Serves an internal page

	var uri  = url.parse(request.url).pathname;

	console.log('Serving', uri);

	switch (uri) {
		case '/code':
		ServeUnlocker(request, response);
		break;
		default:
		response.end('<div style="text-align: center;">Benvenuto al captive portal! Se hai un codice, inseriscilo qua:<form method="post" action="code"><input type="text" name="code" /><br><input type="submit" value="Sblocca" /></form></div>');
		break;
	}
}

function HTTPListener(request, response) {
	var host = request.headers.host;

	response.writeHead(200, {
		"Content-Type": "text/html",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": 0
	}); // Prevents browsers from caching the content

	if (host != '192.168.254.1') {
		ServeBlockedPage(request, response);
	} else {
		ServeCaptive(request, response);
	}
}

http.createServer(HTTPListener).listen(80, "192.168.254.1");
console.log("Captive portal running");