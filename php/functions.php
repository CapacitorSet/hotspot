<?PHP

$_CONFIG['profiles'] = "profiles.json";

function readProfiles($file){
	$handle = fopen($file, "r");
	$json = fread($handle, filesize($file));
	fclose($handle);
	return json_decode($json, true);
}
?>