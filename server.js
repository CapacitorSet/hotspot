#!/usr/bin/nodejs
// The line above tells something in Linux (I think bash but idk) that when you run "./server.js", it shuld use "/usr/bin/nodejs ./server.js".
// Note that /usr/bin/nodejs is a longer form for "nodejs", generally: "nodejs server.js" and "/usr/bin/nodejs server.js" do the same thing.

// "use strict"; // This tells the engine to whine when it usually wouldn't

var http   = require("http"),
	url    = require("url"),
	path   = require("path"),
	fs     = require("fs"),
	tokens = require("/etc/hotspot/lib/tokens.js"),
	profiles = require("/etc/hotspot/lib/profiles.js"),
	qs     = require("querystring");
// This loads a few required modules.
// Modules are basically sets of useful functions, grouped together.
// For example, the module "http" (which is called using 'require("http")')	provides the function createServer.

var pages = ["blocked", "welcome", "unlocked", "wrongCode", "error"],
	page = {};
pages.forEach(function (pageName) {
	page[pageName] = fs.readFileSync("/etc/hotspot/html/" + pageName + ".htm").toString('utf8');
});
/* We define an array describing which pages to load.
 * Then, for each item in this array, we read the corresponding file on disk. [Ignore the .toString('utf8')]
 * For example, if the array was ["blocked", "welcome"] the code above would do this:
 *
 * page["blocked"] = fs.readFileSync("/etc/hotspot/html/blocked.htm").toString('utf8'); // Meaning it stores the content of /etc/hotspot/html/blocked.htm in page["blocked"]
 * page["welcome"] = fs.readFileSync("/etc/hotspot/html/welcome.htm").toString('utf8'); // Meaning it stores the content of /etc/hotspot/html/welcome.htm in page["welcome"]
 */

 /* Note that "page" behaves like an array, but it's more powerful. We call those "objects". Look at the difference between arrays and objects:
  * thisIsAnArray = ["afilini", "the-beat-goes-onn"]; // This would mean thisIsAnArray[0] = "afilini", thisIsAnArray[1] = "the-beat-goes-onn"
  * thisIsAnObject = {"afilini": "afilini.tumblr.com", "the-beat-goes-onn": "the-beat-goes-onn.tumblr.com"}; // This would mean thisIsAnObject["afilini"] = "afilini.tumblr.com", thisIsAnObject["the-beat-goes-onn"] = "the-beat-goes-onn.tumblr.com"
  * // Or alternatively, thisIsAnObject.afilini = "afilini.tumblr.com". This is completely equivalent to 'thisIsAnObject["afilini"] = "afilini.tumblr.com"'.
  */

// Now, we define a ton of functions. These are skipped: the "real code" is actually at the end of the file.

function exec(command, sudo, callback) {
	// Executes a command, optionally as superuser (prepends "sudo").

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
	// Geek magic, you can ignore this
	// Crafts a rmtrack command for an IP

	return 'rmtrack ' + IP;
}

function CraftIptablesUnlocker(item) {
	// Geek magic, you can ignore this
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
	// Geek magic, you can ignore this
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
	// Geek magic, you can ignore this
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

	// Ignore this, there's some geek magic
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
	// Since a profile is an array of items, we loop through this array and unlock each item.
}

function UnlockProfileFromToken(tokenData, IP, MAC) {
	// Unlocks a profile according to the token data given

	profile = profiles.GetProfile(tokenData.profile);
	if (typeof profile == 'undefined') {
		return -1;
	}
	// Fetches profile data using profiles.GetProfile
	UnlockProfile(profile, IP, MAC, tokenData.minutes);
	return 0;
}

function GetPOSTData(request, callback) {
	// Ignore this.
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
	// Fetches the content of page.unlocked, then replaces "$profile" with the actual profile name, and "$minutes" with the actual amount of minutes.
	response.end(html);
	// Then, it shows it to the user.
}

function ServeError(response) {
	// Serves a generic error page

	response.end(page.error);
}

function GetClientData(request, callback) {
	// Ignore this.
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

	if (request.method == 'POST') { // Ignore this
		GetPOSTData(request, function (POST) {
			// The function GetPOSTData fetches the data the form sent us, and makes it available through the variable POST in this anonymous function.
			var code = POST.code;
			tokens.ReadToken(code, function(err, tokenData) {
				// We provide "code", and the function ReadToken (from the library "/etc/hotspot/lib/tokens.js", see header) returns us either an error as the first parameter, or the token data as the second parameter.
				if (err) {
					// If the function provided err, i.e. if an error was met
					ServeWrongCode(response);
				} else {
					// If the function did NOT provide err, meaning no error was met
					tokens.DestroyToken(code);
					GetClientData(request, function(clientData) {
						// The function GetClientData returns the object clientData, which contains clientData.IP and clientData.MAC.
						minutes = tokenData.minutes;
						result  = UnlockProfileFromToken(tokenData, clientData.IP, clientData.MAC);
						if (result == -1) {
							ServeError(response, request);
						} else {
							ServeUnlocked(response, tokenData);
						}
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

	response.end(page.welcome); // Sends the content of page.welcome to the user.
	// page.welcome contains the file /etc/hotspot/html/welcome.htm.
}

function ServeCaptive(response, request) {
	// Serves an internal page

	var uri  = url.parse(request.url).pathname; // Ignore this

	console.log('Serving', uri);

	switch (uri) { // Check what page was asked for, and act accordingly.
		case '/code':
			// If they visited http://192.168.254.1/code
			//                                     ^^^^^
			ServeUnlocker(response, request);
			// Serve the unlocker. /code is the page which receives the data from the form.
			break;
		default:
			// If they visited any other page
			ServeWelcome(response);
			// Serve a "welcome!" page with a form which sends data to /page
			break;
	}
}

function ServeBlocked(response, request) {
	// Serves a "this page is blocked!" page

	console.log('Intercettata richiesta a ' + request.headers.host);
	response.end(page.blocked); // Sends the content of page.blocked to the user.
	// Remember what page.blocked is?
	// We wrote it at the top of the file: it contains the file /etc/hotspot/html/blocked.htm.
}

function HTTPListener(request, response) {
	// Woo, you did it!
	// This function receives a request object, and a response object.

	var host = request.headers.host; // Ignore this

	response.writeHead(200, {
		"Content-Type": "text/html",
		"Cache-Control": "no-cache, no-store, must-revalidate",
		"Pragma": "no-cache",
		"Expires": 0
	}); // Prevents browsers from caching the content.
	// Ignore this for now.

	if (host != '192.168.254.1') {
		// If the user visited a website other than http://192.168.254.1
		ServeBlocked(response, request);
		// Call the function ServeBlocked, and pass along the response and request objects.
		// It serves a "blocked!" page
	} else {
		// Else (i.e. if they visited the website http://192.168.254.1)
		ServeCaptive(response, request);
		// Call the function ServeCaptive, and pass along the response and request objects.
		// It serves the appropriate page.
	}
}

// Here is the first "real code"!
/* This creates an HTTP server on port 80 on the IP 192.168.254.1.
 * Note that it is equivalent to:
 *
 *     var something = http.createServer(HTTPListener);
 *     something.listen(80, "192.168.254.1");
 *
 * but since we don't need the variable "something", we just concatenate the two functions together: http.createServer().listen().
 */

http.createServer(HTTPListener).listen(80, "192.168.254.1");
//                ^ See this? This means "the function HTTPListener()". Note that parameters aren't needed.
// To understand what HTTPListener does, read the code a few lines up.
console.log("Captive portal running");