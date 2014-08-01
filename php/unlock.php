<?PHP
include("functions.php");

$profile = $_GET['profile'];
$arrayProfiles = readProfiles($_CONFIG['profiles']);
$profile = "afilini-goes-onn";
if(array_key_exists($profile, $arrayProfiles)){
	$ip = $_SERVER['REMOTE_ADDR'];
	echo "Comandi eseguiti: <br /><pre>";
	$stdout = shell_exec("sudo arp -an ".$ip);
	echo "sudo arp -an ".$ip."\n";
	preg_match_all('/([a-f0-9]{2}:){5}[a-f0-9]{2}/', $stdout, $matches);
	$mac = $matches[0][0];
	echo $stdout . " mac trovato: " . $mac . "\n\n";
	foreach($arrayProfiles[$profile] as $item){
		$out = shell_exec('sudo iptables -I internet 1 -t mangle -p tcp -d ' . $item['host'] . ' --dport ' . $item['port'] . ' -m mac --mac-source ' . $mac . ' -j RETURN');
		echo 'sudo iptables -I internet 1 -t mangle -p tcp -d ' . $item['host'] . ' --dport ' . $item['port'] . ' -m mac --mac-source ' . $mac . ' -j RETURN\n';
		echo $out."\n";
		$out = shell_exec('sudo rmtrack ' . $ip);
		echo 'sudo rmtrack ' . $ip . "\n";
		echo $out . "\n\n";
	}
	echo "Account sbloccato <br />";
	echo "</pre>";
}else{

	echo 'Profilo sconosciuto, torna al <a href="http://192.168.254.1">captive portal</a>';
}
?>