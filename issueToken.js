#!/usr/bin/nodejs

var tokens = require('/etc/hotspot/lib/tokens');

minutes = process.argv[2] || 1440; // Default: 1 day
profile = process.argv[3];

tokens.IssueToken(minutes, profile);