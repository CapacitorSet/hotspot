#!/usr/bin/nodejs

var tokens = require('/etc/hotspot/lib/tokens');

token = process.argv[2];

if (token == "") {
	console.log("Syntax: sudo node revokeToken.js <token>");
} else {
	tokens.RevokeToken(token);
}