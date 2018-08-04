<?php

date_default_timezone_set('Europe/Kiev');

$action = $_GET['action'] ?? null;

$jsonp_callback = $_GET['callback'] ?? null;

$json_data = array();

function get_client_ip()
{
    return $_SERVER['HTTP_CLIENT_IP'] ??
        $_SERVER['HTTP_X_FORWARDED_FOR'] ??
        $_SERVER['HTTP_X_FORWARDED'] ??
        $_SERVER['HTTP_FORWARDED_FOR'] ??
        $_SERVER['HTTP_FORWARDED'] ??
        $_SERVER['REMOTE_ADDR'] ?? null;
}

function _log($text)
{
    $text = "[" . date("F j, Y, g:i a") . "] "
        . ($_SERVER['REQUEST_URI'] ?? '') . " " . (get_client_ip() ?? 'unknown') . PHP_EOL

        . $_SERVER['HTTP_USER_AGENT'] . PHP_EOL
        . $text . PHP_EOL
        . PHP_EOL;


    file_put_contents('./clients.log', $text, FILE_APPEND);
}

switch ($action) {
    case 'log-console':
        $isConsoleDetected = filter_var($_GET['console'] ?? false, FILTER_VALIDATE_BOOLEAN);

        _log("\tconsole detected: " . ($isConsoleDetected ? 'yes' : 'no'));

        $json_data = array('result' => true);
        break;
    default:
        $sandbox = filter_var($_GET['sandbox'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $audioSupport = filter_var($_GET['audio'] ?? false, FILTER_VALIDATE_BOOLEAN);


        _log(
            "\tsandbox: " . ($sandbox ? 'yes' : 'no')
                . "\n\taudio support: " . ($audioSupport ? 'yes' : 'no')
        );


        $json_data = array(
            'html' => file_get_contents('./banners/banner.html'),
            'scripts' => array(),
            'data' => array('audio' => $audioSupport, 'sandbox' => $sandbox, 'bool' => true)
        );


        $json_data['scripts']['banner_script'] = file_get_contents('./js/banner-script.js');

        if (!$sandbox) {
            $json_data['scripts']['console_detect'] = file_get_contents('./js/detect-console.js');
        }


}

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

echo "$jsonp_callback(" . json_encode($json_data) . ")";



