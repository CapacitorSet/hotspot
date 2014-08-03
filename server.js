#!/usr/bin/nodejs
var http = require("http"),
url = require("url"),
path = require("path"),
fs = require("fs"),
crypto = require("crypto");

function exec(command, callback) {
	console.log("Executing", command)
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(error, stdout, stderr);
			if (error) {
				console.log('Command:', command)
			}
		})
	}
}

function unlock(profileName, IP, MAC, minutes) {
	profiles = JSON.parse(fs.readFileSync('/etc/hotspot/profiles.json').toString("utf8"));
	profile = profiles[profileName]; // Gets the profile whose name equals the content of profile.
	// Eg. if "/unlock.htm?profile=apple" was requested, profile will contain the profile whose name is "apple".
	profile.forEach(function (item) {
		cmd = 'iptables -I internet 1 -t mangle -p tcp ';
		if (item.host) {
			cmd += '-d ' + item.host + ' ';
		}
		if (item.port) {
			cmd += '--dport ' + item.port + ' ';
		}
		cmd += '-m mac --mac-source ' + MAC + ' -j RETURN';
		exec(cmd);
		exec('sudo rmtrack ' + IP, function(error, stdout, stderr) {
			console.log(stdout);
		});
		if (minutes) {
			cmd = 'echo "sudo iptables -D internet -t mangle -p tcp ';
			if (item.host) {
				cmd += '-d ' + item.host + ' ';
			}
			if (item.port) {
				cmd += '--dport ' + item.port + ' ';
			}
			cmd += '-m mac --mac-source ' + MAC + ' -j RETURN" | sudo at now + ' + minutes + ' minutes';
			exec(cmd);
			exec('echo "sudo rmtrack ' + IP + '" | sudo at now + ' + minutes + ' minutes', function(error, stdout, stderr) {
				console.log(stdout);
			});
		}
	});
}

http.createServer(function(request, response) {
	var uri = url.parse(request.url).pathname,
	ip = request.connection.remoteAddress;
	response.writeHead(200, {
		"Content-Type": "text/html",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": 0
	}); // Prevents browsers from caching the content

	if (request.headers.host != '192.168.254.1') {
		console.log('Intercettata richiesta a ' + request.headers.host);
		response.write('Questa pagina &egrave; bloccata! Se hai un account, clicca <a href="http://192.168.254.1">qui</a> per sbloccare l\'accesso a Internet.');
		response.end();
	} else {
		console.log(uri);
		if (uri == "/code") {
			console.log()
			// Parse POST data. http://stackoverflow.com/a/4310087/1541408
			if (request.method == 'POST') {
				var body = '';
				request.on('data', function (data) {
					body += data;
					// Too much POST data, kill the connection!
					if (body.length > 1e6) { req.connection.destroy(); }
				});
				request.on('end', function () {
					var POST = require('querystring').parse(body);
					filename = crypto.createHash("sha256").update(POST.code).digest('hex')
					fs.readFile("/etc/hotspot/tokens/" + filename, { encoding: 'utf8' }, function(err, data) {
						data = JSON.parse(data);
						if (err) {
							response.end("errore");
						} else {
							fs.unlink("/etc/hotspot/tokens/" + filename);
							exec("sudo arp -an " + ip, function(error, stdout, stderr) {
								MAC = stdout.match(/..:..:..:..:..:../);
								minutes = data.minutes;
								console.log('unlock('+data.profile+', '+ip+', '+MAC+', '+minutes+');');
								unlock(data.profile, ip, MAC, minutes);
								today = new Date();
								response.end("Ora puoi navigare per " + minutes + " minuti (fino a " + Date(today.getTime()+minutes * 1440) + ")!");
							});
						}
					});
				});
			}
		} else {
			response.end('<div style="text-align: center;">Benvenuto al captive portal! Se hai un codice, inseriscilo qua:<form method="post" action="code"><input type="text" name="code" /><br><input type="submit" value="Sblocca" /></form></div>');
		}
	}
}).listen(80, "192.168.254.1");
console.log("Captive portal running");