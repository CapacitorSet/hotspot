// Creates a standalone installer.

var fs = require('fs'),
	profiles = JSON.parse(fs.readFileSync('profiles.json').toString('utf8')),
	hotspot = fs.readFileSync('hotspot').toString('utf8');

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
server_64 = fs.readFileSync('server.js').toString('base64');
rmtrack_64 = fs.readFileSync('rmtrack').toString('base64');
// dhcpd_64 = fs.readFileSync('dhcpd.conf').toString('base64');
profiles_64 = fs.readFileSync('profiles.json').toString('base64');

setup =  '#!/bin/bash\n';
setup += 'apt-get install coreutils dnsmasq hostapd conntrack nodejs\n';
/* 
	coreutils: 			required for base64
	dnsmasq: 			DHCP server
	hostapd:			wireless utility
	conntrack:			required by rmtrack
	nodejs:				required by server.js
*/
// setup += 'echo "' + dhcpd_64   + '" | base64 -d | cat > /etc/dhcp/dhcpd.conf\n';
setup += 'echo "' + hotspot_64 + '" | base64 -d | cat > /usr/bin/hotspot\n';
setup += 'echo "' + server_64  + '" | base64 -d | cat > /usr/bin/server.js\n';
setup += 'echo "' + rmtrack_64 + '" | base64 -d | cat > /usr/bin/rmtrack\n';
setup += 'echo "' + profiles_64+ '" | base64 -d | cat > /usr/bin/profiles.json\n';
setup += 'chmod +x /usr/bin/hotspot\n';
setup += ''

fs.writeFileSync("install.sh", setup);