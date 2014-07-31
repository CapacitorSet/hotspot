// Creates a standalone installer.

var fs = require('fs');

bin_64 = fs.readFileSync('hotspot').toString('base64');
server_64 = fs.readFileSync('server.js').toString('base64');
rmtrack_64 = fs.readFileSync('rmtrack').toString('base64');

setup =  '#!/bin/bash\n';
setup += 'apt-get install coreutils dnsmasq hostapd conntrack nodejs\n';
/* 
	coreutils: required for base64
	dnsmasq:   DHCP server
	hostapd:   wireless utility
	conntrack: required by rmtrack
	nodejs:    required by server.js
*/
setup += 'echo "' + bin_64     + '" | base64 -d | cat > /usr/bin/hotspot\n';
setup += 'echo "' + server_64  + '" | base64 -d | cat > /usr/bin/server.js\n';
setup += 'echo "' + rmtrack_64 + '" | base64 -d | cat > /usr/bin/rmtrack\n';
setup += 'chmod +x /usr/bin/hotspot\n';
fs.writeFileSync("install.sh", setup);;
