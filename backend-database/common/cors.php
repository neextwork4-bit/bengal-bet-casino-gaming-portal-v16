<?php
/**
 * Universal CORS Header Handler for NeextPlay & BengalBet PHP API
 */

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept');
    header('Access-Control-Max-Age: 86400');
}

// Handle preflight OPTIONS request immediately
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
