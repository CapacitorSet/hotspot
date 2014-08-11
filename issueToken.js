#!/usr/bin/nodejs

var tokens = require('/etc/hotspot/lib/tokens');

profile = process.argv[2];
minutes = process.argv[3] || 1440; // Default: 1 day

if (profile == "") {
	console.log("Syntax: sudo node issueToken.js <profile> [<minutes>]");
} else {
	result = tokens.IssueToken(minutes, profile);
	if (result == -1) {
		console.log("The profile you selected wasn't found. Nevertheless, a token will be issued. To revoke the token, use revokeToken.js <code>.");
	}
}