<?php

define('COUCHDB_HOST', 'localhost');
define('COUCHDB_PORT', 5984);
define('COUCHDB_USER', 'admin');
define('COUCHDB_PASS', 'password');

define('CODE_CHARS', 'ABCDEFGHJKMNPQRSTUVWXY3456789');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	echo '<html><head><title>Shopping Buddy</title></head><body><p>Shopping Buddy Ver 1.0.0</p></body></html>';
	die();
}

$autoloader = join(DIRECTORY_SEPARATOR,[__DIR__,'vendor','autoload.php']);
require $autoloader;

use PHPOnCouch\CouchAdmin;
use PHPOnCouch\CouchClient;
use PHPOnCouch\Exceptions;

$client = new CouchClient('http://' . COUCHDB_USER . ':' . COUCHDB_PASS . '@' . COUCHDB_HOST . ':' . COUCHDB_PORT,'dbcodes');
$admin = new CouchAdmin($client);

$json = file_get_contents('php://input');
$request = json_decode($json, true);

header('Content-Type: application/json; charset=utf-8');

// Check that request is supported
if (!in_array($request['cmd'], array('create', 'open', 'get-code', 'redeem-code'))) {
	echo json_encode(array('status' => 'error', 'statusText' => 'Unrecognized request: [' . $request['cmd'] . ']'));
	die();
}

// Common setup for create, open and get-code
if (in_array($request['cmd'], array('create', 'open', 'get-code'))) {

	if (strlen($request['name']) < 10) {
		echo json_encode(array('status' => 'error', 'statusText' => 'List name must be at least 10 characters'));
		die();
	}

	if (strlen($request['pin']) < 4) {
		echo json_encode(array('status' => 'error', 'statusText' => 'Access PIN must be at least 4 characters'));
		die();
	}

	$user = (file_exists('test') ? 't337x-' : '') . hash('md5', $request['name'] . $request['pin']);
	$pass = hash('md5', $request['pin'] . $request['name']);

	$exists = true;
	try {
		$admin->getUser($user);
	}
	catch(Exception $e) {
		if ($e->getCode() == 404) {
			$exists = false;
		}	else {
			echo json_encode(array('status' => 'error', 'statusText' => $e->getMessage()));
			die();
		}
	}
}

// Handle request
switch($request['cmd']) {

	case 'create': {
		if ($exists) {
			echo json_encode(array('status' => 'error', 'statusText' => 'List name and PIN are already taken'));
			die();
		}	else {
			try {
				$admin->createUser($user, $pass);
				echo json_encode(array('status' => 'ok', 'dbName' => 'userdb-' . implode(unpack("H*", $user)), 
					'dbUser' => $user, 'dbPass' => $pass));
			} catch(Exception $e) {
				echo json_encode(array('status' => 'error', 'statusText' => $e->getMessage()));
				die();
			}
		}
	}
	break;
	
	case 'open': {
		if (!$exists) {
			echo json_encode(array('status' => 'error', 'statusText' => 'List does not exist'));
			die();
		} else {
			echo json_encode(array('status' => 'ok', 'dbName' => 'userdb-' . implode(unpack("H*", $user)), 
				'dbUser' => $user, 'dbPass' => $pass));
		}
	}
	break;
	
	case 'get-code': {
		if (!$exists) {
			echo json_encode(array('status' => 'error', 'statusText' => 'List does not exist'));
			die();
		} else {
			// Generate a 4-digit code that either 1) does not yet exist in the database, or
			// 2) exists in the database but has timed out
			while(true) {
				$code = substr(str_shuffle(str_repeat(CODE_CHARS, 4)), 0, 4);
				try {
					$doc = $client->getDoc($code);
					$diff = time() - $doc->ts;
					if ($diff < 0 || $diff > 5*60) break;
				} catch(Exception $e) {
					if ($e->getCode() != 404) {
						echo json_encode(array('status' => 'error', 'statusText' => $e->getMessage()));
						die();
					}
					// Code not found in database. Construct new document.
					$doc = new stdClass();
					$doc->_id = $code;
					break;
				}
			}
			// Write new document, or expired document with updated details, to database
			try {
				$doc->listname = $request['name'];
				$doc->listpin = $request['pin'];
				$doc->ts = time();
				$client->storeDoc($doc);
				echo json_encode(array('status' => 'ok', 'code' => $doc->_id));
				break;
			} 
			catch(Exception $e) {
				echo json_encode(array('status' => 'error', 'statusText' => $e->getMessage()));
				die();
			}
		}
	}
	break;
	
	case 'redeem-code': {
		if (strlen($request['code']) != 4) {
			echo json_encode(array('status' => 'error', 'statusText' => 'Invalid code'));
			die();
		} else {
			try {
				$doc = $client->getDoc(strtoupper($request['code']));
				$diff = time() - $doc->ts;
				if ($diff < 0 || $diff > 5*60) {
					echo json_encode(array('status' => 'error', 'statusText' => 'Access code has timed out'));
					die();
				}
				echo json_encode(array('status' => 'ok', 'listName' => $doc->listname, 'listPin' => $doc->listpin));
			} catch(Exception $e) {
				if ($e->getCode() == 404) {
					echo json_encode(array('status' => 'error', 'statusText' => 'Invalid code'));
				} else {
					echo json_encode(array('status' => 'error', 'statusText' => $e->getMessage()));
				}
				die();
			}
		}
	}
	break;
}

?>