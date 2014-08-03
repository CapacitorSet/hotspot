#!/usr/bin/nodejs

var crypto = require('crypto'),
	fs = require('fs');

function generate(length) {
	var string = '',
		alphabet = 'qwertyuiopasdfghjklzxcvbnm'; // No capitals or digits, to prevent confusion

	for (var i = 0; i < length; i++) {
		var randomNumber = Math.floor(Math.random() * alphabet.length);
		string += alphabet.substring(randomNumber, randomNumber + 1);
	}

	return string;
}

console.log('Remember to run this script as root!')

code = generate(8);
minutes = process.argv[2] || 1440; // Default: 1 day
profile = process.argv[3];

filename = crypto.createHash("sha256").update(code).digest('hex');

contents = {
	"minutes": minutes,
	"profile": profile
};

fs.writeFile('/etc/hotspot/tokens/' + filename, JSON.stringify(contents), { encoding: 'utf8' }, function(err){
	if (err) {
		console.log("Unable to write to file:", err);
	} else {
		console.log('Data written successfully!');
		console.log('Code:', code);
		console.log('Valid for', minutes, 'minutes (' + minutes/60, 'hours,', minutes/1440, 'days)');
	}
});