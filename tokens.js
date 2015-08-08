var fs     = require('fs'),
	crypto = require('crypto'),
	profiles = require('/etc/hotspot/lib/profiles.js');
function GetFilenameFromToken(token) {
	/* Returns the hex-formatted sha256 hash of the token.
	 *
	 * I used sha256 mostly because it is filename-safe.
	 */
	return crypto.createHash('sha256').update(token).digest('hex');
}

function GetPathFromToken(token) {
	return '/etc/hotspot/tokens/' + GetFilenameFromToken(token);
}

function ReadTokenData(rawData) {
	// Converts raw data, i.e. what is transmitted/stored/etc, to token data
	return JSON.parse(rawData);
};

function WriteTokenData(tokenData) {
	return JSON.stringify(tokenData);
}

function ReadToken(token, callback) {
	fs.readFile(GetPathFromToken(token), { encoding: 'utf8' }, function (err, rawData) {
		if (err) {
			callback(err); // ReadTokenData will fail, so we just don't call it
		} else {
			callback(null, ReadTokenData(rawData));
		}
	});
}

function DestroyToken(token) {
	fs.unlink(GetPathFromToken(token));
}

function RevokeToken(token) {
	returnVal = DestroyToken(token);
	console.log("Token", token, "revoked!");
	return returnVal;
}

function IssueToken(minutes, profile) {
	code = generate(8);
	path = GetPathFromToken(code);

	contents = {
		"minutes": minutes,
		"profile": profile
	};

	if (typeof profiles.GetProfile(profile) == 'undefined') {
		returnVal = false;
	} else {
		returnVal = true;
	}

	fs.writeFile(path, WriteTokenData(contents), { encoding: 'utf8' }, function(err){
		if (err) {
			console.log("Unable to write to file:", err);
		} else {
			console.log('Code:', code);
			if (profile) { console.log('Profile:', profile); }
			console.log('Valid for', minutes == -1 ? 'evah' : minutes + ' minutes (' + minutes/60 + ' hour(s), ' + minutes/1440 + ' day(s)');
		}
	});
	return returnVal;
}

function generate(length) {
	var string = '',
		alphabet = 'qwertyuiopasdfghjklzxcvbnm'; // No capitals or digits, to prevent confusion

	for (var i = 0; i < length; i++) {
		var randomNumber = Math.floor(Math.random() * alphabet.length);
		string += alphabet.substring(randomNumber, randomNumber + 1);
	}

	return string;
}

module.exports.GetFilenameFromToken = GetFilenameFromToken;
module.exports.GetPathFromToken = GetPathFromToken;
module.exports.ReadTokenData = ReadTokenData;
module.exports.ReadToken = ReadToken;
module.exports.DestroyToken = DestroyToken;
module.exports.IssueToken = IssueToken;