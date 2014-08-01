<?PHP
include('functions.php');

$headers = apache_request_headers();
header('Content-Type: text/html');
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
header('Pragma: no-cache'); // HTTP 1.0.
header('Expires: 0'); // Proxies.
if($headers['Host'] != "192.168.254.1"){
	echo 'Per navigare devi fare il login!<br><a href="http://192.168.254.1">Vai alla pagina principale</a>';
}else{
	$profiles = readProfiles($_CONFIG['profiles']);
	echo "<h2>Benvenuto al captive portal!</h2>";
	foreach($profiles as $key => $value){
		echo '<br><a href="unlock.php?profile=' . $key . '">Sblocca ' . $key . ' </a>';
	}
}
?>