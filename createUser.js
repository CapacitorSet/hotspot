#!/usr/bin/nodejs

var crypto = require('crypto'),
	fs = require('fs');

function generate(length) {
	var string = '',
		alphabet = 'qwertyuiopasdfghjklzxcvbnm';

	for (var i = 0; i < length; i++) {
		var randomNumber = Math.floor(Math.random() * alphabet.length);
		string += alphabet.substring(randomNumber, randomNumber + 1);
	}

	return string;
}

console.log('Remember to run this script as root!')

username   = generate(8);
password   = generate(8);
MACs       = process.argv[2] || 1;
days       = process.argv[3] || 30;
expiration = new Date();
expiration.setHours(new Date().getHours() + 24*days); // today + 24*days hours
salt       = crypto.pseudoRandomBytes(32).toString('base64');
hash       = crypto.createHash('sha256');

hash.update(password + salt);

fs.readFile('/etc/hotspot/users.json', { encoding: 'utf8' }, function (err, data) {
	users = JSON.parse(data);
	while (users[username]) {
		username = generate[8];
	}
	users[username] = {
		"password": hash.digest('base64'),
		"salt": salt,
		"MACs": MACs,
		"expiration": expiration
	};
	fs.writeFile('/etc/hotspot/users.json', JSON.stringify(users), { encoding: 'utf8' }, function(){
		console.log('Data written successfully!');
		console.log('Username:', username);
		console.log('Password:', password);
	})
});