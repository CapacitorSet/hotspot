// Creates a standalone installer.

var fs = require('fs');

bin_64 = fs.readFileSync('hotspot').toString('base64');
server_64 = fs.readFileSync('server.js').toString('base64');
rmtrack_64 = fs.readFileSync('rmtrack').toString('base64');

setup =  '#!/bin/bash';
setup += 'apt-get install coreutils dnsmasq hostapd conntrack nodejs';
/* 
	coreutils: required for base64
	dnsmasq:   DHCP server
	hostapd:   wireless utility
	conntrack: required by rmtrack
	nodejs:    required by server.js
*/
setup += 'echo "' + bin_64     + '" | base64 -d > /usr/bin/hotspot\n';
setup += 'echo "' + server_64  + '" | base64 -d > /usr/bin/server.js'
setup += 'echo "' + rmtrack_64 + '" | base64 -d '
fs.writeFileSync("install.sh", setup);
