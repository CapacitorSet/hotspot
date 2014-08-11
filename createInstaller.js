#!/usr/bin/nodejs
// Creates a standalone installer.

var fs = require('fs'),
	profiles = JSON.parse(fs.readFileSync('profiles.json').toString('utf8')),
	hotspot = fs.readFileSync('hotspot').toString('utf8'),
	files = JSON.parse(fs.readFileSync('files.json').toString('utf8'));

function LoopThroughObject(object, callback) {
	// http://stackoverflow.com/a/684692/1541408

	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			callback(key, object[key]);
		}
	}
}

setup =  '#!/bin/bash\n';
setup += 'apt-get install ';
files.packages.forEach(function (package) {
	setup += package + ' ';
});
setup += '\n';

// Parses the whitelist and writes it as a set of iptables rules
whitelist = profiles.whitelist;
replacement = "";
whitelist.forEach(function (item) {
	replacement += "iptables -I internet 1 -t mangle -p tcp ";
	if (item.host) {
		replacement += "-d " + item.host + " ";
	}
	if (item.port) {
		replacement += "--dport " + item.port + " ";
	}
	replacement += "-j RETURN\n"
});
hotspot = hotspot.replace("# INSERT WHITELIST HERE - DO NOT REPLACE THIS LINE IF YOU DON'T KNOW WHAT YOU'RE DOING", replacement);

// Parses the blacklist and writes it as a set of iptables rules
blacklist = profiles.blacklist;
replacement = "";
blacklist.forEach(function (item) {
	replacement += "iptables -I internet 1 -t mangle -p tcp ";
	if (item.host) {
		replacement += "-d " + item.host + " ";
	}
	if (item.port) {
		replacement += "--dport " + item.port + " ";
	}
	replacement += "-j DROP\n"
});
hotspot = hotspot.replace("# INSERT BLACKLIST HERE - DO NOT REPLACE THIS LINE IF YOU DON'T KNOW WHAT YOU'RE DOING", replacement);
hotspot_64 = Buffer(hotspot).toString('base64');
setup += 'echo "' + hotspot_64 + '" | base64 --decode | cat > /usr/bin/hotspot\n';

LoopThroughObject(files.folders, function (folder, fileList) {
	setup += 'mkdir -p "' + folder + '"\n';
	fileList.forEach(function (filename) {
		setup += 'echo "' + fs.readFileSync(filename).toString('base64') + '" | base64 --decode | cat > "' + folder + filename + '"\n';
	})
});

setup += 'chmod +x /usr/bin/hotspot\n';

fs.writeFileSync("install.sh", setup);
require('child_process').exec('chmod +x install.sh');
/*
 * Flags install.sh as executable, i.e. makes it possible to run
 *
 *     $ [sudo] ./install.sh
 *
 */

uninstall = '#!/bin/bash\n';
uninstall += 'hotspot stop\n'; // Restores the previous state of iptables and interfaces
uninstall += 'apt-mark auto ';
files.packages.forEach(function (package) {
	uninstall += package + ' ';
});
uninstall += '\n';
uninstall += 'apt-get autoremove\n';
LoopThroughObject(files.folders, function (folder) {
	setup += 'rm -rfv "' + folder + '"\n';
});
fs.writeFileSync("uninstall.sh", uninstall);
require('child_process').exec('chmod +x uninstall.sh');