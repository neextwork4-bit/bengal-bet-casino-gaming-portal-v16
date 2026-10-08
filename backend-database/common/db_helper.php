<?php
/**
 * Shared Database Helper for BengalBet & NeextPlay PHP MySQL Backend
 */

require_once __DIR__ . '/cors.php';

function get_pdo_connection($host, $port, $user, $pass, $dbname = null) {
    $dsn = "mysql:host={$host};port={$port}";
    if (!empty($dbname)) {
        $dsn .= ";dbname={$dbname};charset=utf8mb4";
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        try {
            $pdo->exec("SET NAMES utf8mb4");
        } catch (Exception $eIgn) {}
        return $pdo;
    } catch (PDOException $e) {
        // If connecting without dbname and charset caused an issue, retry simple DSN
        if (empty($dbname)) {
            try {
                $pdo = new PDO("mysql:host={$host};port={$port}", $user, $pass, $options);
                return $pdo;
            } catch (Exception $e2) {}
        }
        throw new Exception("Database Connection Error: " . $e->getMessage(), (int)$e->getCode());
    }
}

function ensure_database_exists($host, $port, $user, $pass, $dbname) {
    if (empty($dbname)) return true;
    try {
        $pdo = get_pdo_connection($host, $port, $user, $pass, null);
        // Important: MySQL PDO does not permit PREPARE for CREATE DATABASE (DDL).
        // Must use direct exec().
        try {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        } catch (Exception $eCollate) {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}`");
        }
        return true;
    } catch (Exception $e) {
        // User may lack CREATE DATABASE privilege or connection without dbname is restricted
        return false;
    }
}

function send_json_response($data, $statusCode = 200) {
    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function get_request_data() {
    $data = [];
    
    // Check JSON body
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $jsonData = json_decode($rawInput, true);
        if (is_array($jsonData)) {
            $data = array_merge($data, $jsonData);
        }
    }
    
    // Check $_POST
    if (!empty($_POST)) {
        $data = array_merge($data, $_POST);
    }
    
    // Check $_GET
    if (!empty($_GET)) {
        $data = array_merge($data, $_GET);
    }
    
    return $data;
}
