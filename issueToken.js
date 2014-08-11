#!/usr/bin/nodejs

var tokens = require('/etc/hotspot/lib/tokens');

profile = process.argv[2];
minutes = process.argv[3] || 1440; // Default: 1 day

if (profile == "") {
	console.log("Syntax: sudo node issueToken.js <profile> [<minutes>]");
} else {
	tokens.IssueToken(minutes, profile);
}