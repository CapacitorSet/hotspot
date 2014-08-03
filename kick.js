#!/usr/bin/nodejs
function exec(command, callback) {
	console.log("Executing", command)
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(stdout);
		})
	}
}

mac = process.argv[2];
ip = process.argv[3];
profiles = new Buffer(process.argv[4], 'base64').toString('utf8');
profiles.forEach(function (profile) {
	cmd = 'sudo iptables -D internet -t mangle -p tcp ';
	if (item.host) {
		cmd += '-d ' + item.host + ' ';
	}
	if (item.port) {
		cmd += '--dport ' + item.port + ' ';
	}
	cmd += '-m mac --mac-source ' + MAC + ' -j RETURN';
}
exec('sudo rmtrack ' + ip);