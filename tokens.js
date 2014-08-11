var fs     = require('fs'),
	crypto = require('crypto');
function GetFilenameFromToken(token) {
	/* Returns the hex-formatted sha256 hash of the token.
	 *
	 * I used sha256 mostly because it is filename-safe and collision-proof,
	 * i.e., to avoid having two live tokens share the same filename.
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
			callback(err, ReadTokenData(rawData));
		}
	});
}

function DestroyToken(token) {
	fs.unlink(GetPathFromToken(token));
}

function IssueToken(minutes, profile) {
	code = generate(8);
	path = GetPathFromToken(code);

	contents = {
		"minutes": minutes,
		"profile": profile
	};

	fs.writeFile(path, WriteTokenData(contents), { encoding: 'utf8' }, function(err){
		if (err) {
			console.log("Unable to write to file:", err);
		} else {
			console.log('Code:', code);
			if (profile) { console.log('Profile:', profile); }
			console.log('Valid for', minutes, 'minutes (' + minutes/60, 'hours,', minutes/1440, 'days)');
		}
	});
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