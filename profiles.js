var profiles = JSON.parse(require('fs').readFileSync('/etc/hotspot/profiles.json').toString("utf8"));

function GetProfile(profileName) {
	return profiles[profileName];
}

module.exports.GetProfile = GetProfile;