const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
	console.log("Nuova richiesta:", req.url);
	next();
});

function exec(command, callback) {
	if (typeof callback == 'function') {
		require('child_process').exec(command, callback);
	} else {
		require('child_process').exec(command, function(error, stdout, stderr) {
			console.log(error, stdout, stderr);
		})
	}
}

app.get("/", (req, res) => {
	const host = req.headers.host.replace(/:\d+/, "");
/*	if (host != "192.168.254.1")
		res.redirect("http://192.168.254.1/");*/
	res.sendFile("/home/jules/codice/hotspot/html/welcomeFullAccess.html");
});

app.use(express.static("static"));

app.get("/login", (req, res) => {
	res.sendFile("/home/jules/codice/hotspot/html/login.html")
});

app.use("/no-op", (req, res) => {
	res.end("");
});

app.use("/entra", (req, res) => {
	var IP = req.connection.remoteAddress.match(/\d+\.\d+\.\d+\.\d+/)[0];
	console.log(IP);
	exec("arp -an " + IP, function(error, stdout, stderr) {
		// At some point in the output the MAC will appear as eg. 01:23:45:67:89:ab
		var MAC = stdout.match(/..:..:..:..:..:../);
		console.log(`MAC: ${MAC}`);
		exec("iptables -I internet 1 -t mangle -p tcp -m mac --mac-source " + MAC + " -j RETURN");
		res.sendFile("/home/jules/codice/hotspot/html/fatto.html");
	});
})

// Adesso devo solo collegare l'applicazione express al firewall e poi funziona tutto
// Ah no, in teoria dovrei anche controllare che ha fatto il login ma vabeh

app.post("/myLogin", (req, res) => {
	fs.writeFileSync("/home/jules/codice/hotspot/" + Math.random() + ".txt", JSON.stringify(req.body));
	res.sendFile("/home/jules/codice/hotspot/html/loginOk.html");
});

app.use("*", (req, res) => {
	const host = req.headers.host.replace(/:\d+/, "");
	if (host != "192.168.254.1")
		res.redirect("http://192.168.254.1/");
});

app.listen(80, err => {
	if (err) throw err;
	console.log("Listening!");
});
