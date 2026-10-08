<?php
/**
 * BengalBet & NeextPlay - Database Backend Master API
 * 
 * Secure Master File Management & Database Migration Hub
 * Allows BengalBet Admin and NeextPlay Super Admin to:
 * 1. List all backend database files
 * 2. Read file contents
 * 3. Update, add, or edit files (api.php, config.php, process.php, schema.sql, etc.)
 * 4. Delete files
 * 5. Execute raw SQL queries on bengalbet_db or neextplay_db
 * 6. Trigger database migrations & schema synchronization
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db_helper.php';
require_once __DIR__ . '/../bengalbet/config.php';
require_once __DIR__ . '/../neextplay/config.php';

$baseDir = realpath(__DIR__ . '/..');
$input = get_request_data();
$action = $input['action'] ?? ($_GET['action'] ?? 'status');

// Helper to normalize and secure relative path within backend-database
function get_safe_backend_path($baseDir, $relativePath) {
    $cleanRel = ltrim(str_replace(['../', '..\\'], '', $relativePath), '/\\');
    $fullPath = $baseDir . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $cleanRel);
    
    // Ensure the target path resides within baseDir
    $realBase = realpath($baseDir);
    $parentDir = dirname($fullPath);
    
    // If target file already exists, check realpath
    if (file_exists($fullPath)) {
        $realTarget = realpath($fullPath);
        if (strpos($realTarget, $realBase) !== 0) {
            throw new Exception("Security error: Target path outside backend-database directory.");
        }
        return $fullPath;
    }
    
    // If directory exists, check parent realpath
    if (file_exists($parentDir)) {
        $realParent = realpath($parentDir);
        if (strpos($realParent, $realBase) !== 0) {
            throw new Exception("Security error: Target directory outside backend-database directory.");
        }
    }
    
    return $fullPath;
}

switch ($action) {
    case 'status':
    case 'ping':
        send_json_response([
            'success' => true,
            'service' => 'database_backend_master_api',
            'version' => '3.0.0',
            'server_time' => date('Y-m-d H:i:s'),
            'root_path' => $baseDir,
            'databases' => [
                'bengalbet' => BB_DB_NAME,
                'neextplay' => NP_DB_NAME
            ]
        ]);
        break;

    // -------------------------------------------------------------
    // LIST ALL BACKEND DATABASE FILES
    // -------------------------------------------------------------
    case 'list_files':
        $fileList = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            if ($item->isFile()) {
                $filePath = $item->getPathname();
                $relPath = str_replace([$baseDir . DIRECTORY_SEPARATOR, $baseDir . '/'], '', $filePath);
                $relPath = str_replace('\\', '/', $relPath);

                // Group by domain
                $category = 'root';
                if (strpos($relPath, 'bengalbet/') === 0) $category = 'bengalbet';
                else if (strpos($relPath, 'neextplay/') === 0) $category = 'neextplay';
                else if (strpos($relPath, 'common/') === 0) $category = 'common';

                $fileList[] = [
                    'path' => $relPath,
                    'name' => basename($relPath),
                    'category' => $category,
                    'size' => filesize($filePath),
                    'modified_at' => date('Y-m-d H:i:s', filemtime($filePath)),
                    'is_writable' => is_writable($filePath),
                    'extension' => pathinfo($filePath, PATHINFO_EXTENSION)
                ];
            }
        }

        // Sort by category then path
        usort($fileList, function($a, $b) {
            return strcmp($a['path'], $b['path']);
        });

        send_json_response([
            'success' => true,
            'total_files' => count($fileList),
            'files' => $fileList
        ]);
        break;

    // -------------------------------------------------------------
    // READ FILE CONTENT
    // -------------------------------------------------------------
    case 'get_file':
        $relPath = $input['path'] ?? ($_GET['path'] ?? '');
        if (empty($relPath)) {
            send_json_response(['success' => false, 'error' => 'File path is required'], 400);
        }

        try {
            $fullPath = get_safe_backend_path($baseDir, $relPath);
            if (!file_exists($fullPath)) {
                send_json_response(['success' => false, 'error' => "File not found: {$relPath}"], 404);
            }

            $content = file_get_contents($fullPath);
            $lines = count(explode("\n", $content));

            send_json_response([
                'success' => true,
                'path' => $relPath,
                'name' => basename($relPath),
                'size' => filesize($fullPath),
                'lines' => $lines,
                'modified_at' => date('Y-m-d H:i:s', filemtime($fullPath)),
                'content' => $content
            ]);
        } catch (Exception $e) {
            send_json_response(['success' => false, 'error' => $e->getMessage()], 400);
        }
        break;

    // -------------------------------------------------------------
    // SAVE / UPDATE / CREATE FILE CONTENT
    // -------------------------------------------------------------
    case 'save_file':
        $relPath = $input['path'] ?? '';
        $content = $input['content'] ?? null;

        if (empty($relPath) || $content === null) {
            send_json_response(['success' => false, 'error' => 'Path and content parameters are required'], 400);
        }

        try {
            $fullPath = get_safe_backend_path($baseDir, $relPath);
            $dir = dirname($fullPath);
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }

            $bytesWritten = file_put_contents($fullPath, $content);
            if ($bytesWritten === false) {
                send_json_response(['success' => false, 'error' => 'Failed to write file. Check directory permissions.'], 500);
            }

            send_json_response([
                'success' => true,
                'message' => "File '{$relPath}' saved successfully ({$bytesWritten} bytes)",
                'path' => $relPath,
                'bytes' => $bytesWritten,
                'modified_at' => date('Y-m-d H:i:s')
            ]);
        } catch (Exception $e) {
            send_json_response(['success' => false, 'error' => $e->getMessage()], 400);
        }
        break;

    // -------------------------------------------------------------
    // DELETE FILE
    // -------------------------------------------------------------
    case 'delete_file':
        $relPath = $input['path'] ?? '';
        if (empty($relPath)) {
            send_json_response(['success' => false, 'error' => 'Path is required'], 400);
        }

        try {
            $fullPath = get_safe_backend_path($baseDir, $relPath);
            if (!file_exists($fullPath)) {
                send_json_response(['success' => false, 'error' => 'File not found'], 404);
            }

            // Prevent deleting critical root files
            $protected = ['index.php', 'process.php', 'common/cors.php', 'common/db_helper.php', 'common/master_api.php'];
            if (in_array($relPath, $protected)) {
                send_json_response(['success' => false, 'error' => 'Cannot delete system-critical file: ' . $relPath], 403);
            }

            unlink($fullPath);
            send_json_response([
                'success' => true,
                'message' => "File '{$relPath}' deleted successfully"
            ]);
        } catch (Exception $e) {
            send_json_response(['success' => false, 'error' => $e->getMessage()], 400);
        }
        break;

    // -------------------------------------------------------------
    // EXECUTE RAW SQL QUERY (ON BENGALBET OR NEEXTPLAY)
    // -------------------------------------------------------------
    case 'execute_sql':
        $targetDb = $input['database'] ?? ($_GET['database'] ?? 'bengalbet');
        $sql = trim($input['sql'] ?? '');

        if (empty($sql)) {
            send_json_response(['success' => false, 'error' => 'SQL query cannot be empty'], 400);
        }

        try {
            $pdo = ($targetDb === 'neextplay') ? get_neextplay_db(true) : get_bengalbet_db(true);
            $startTime = microtime(true);
            
            // Determine if query is a SELECT/SHOW/DESCRIBE or modifying statement
            $isSelect = preg_match('/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i', $sql);

            if ($isSelect) {
                $stmt = $pdo->query($sql);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $columns = !empty($rows) ? array_keys($rows[0]) : [];
                $durationMs = round((microtime(true) - $startTime) * 1000, 2);

                send_json_response([
                    'success' => true,
                    'database' => ($targetDb === 'neextplay') ? NP_DB_NAME : BB_DB_NAME,
                    'query' => $sql,
                    'execution_time_ms' => $durationMs,
                    'total_rows' => count($rows),
                    'columns' => $columns,
                    'rows' => $rows
                ]);
            } else {
                $affected = $pdo->exec($sql);
                $durationMs = round((microtime(true) - $startTime) * 1000, 2);

                send_json_response([
                    'success' => true,
                    'database' => ($targetDb === 'neextplay') ? NP_DB_NAME : BB_DB_NAME,
                    'query' => $sql,
                    'execution_time_ms' => $durationMs,
                    'affected_rows' => $affected,
                    'message' => "Query executed successfully. Affected rows: {$affected}"
                ]);
            }
        } catch (Exception $e) {
            send_json_response([
                'success' => false,
                'error' => $e->getMessage(),
                'query' => $sql
            ], 400);
        }
        break;

    // -------------------------------------------------------------
    // RUN MASTER PROCESS / AUTO MIGRATION
    // -------------------------------------------------------------
    case 'run_process':
        $target = $input['target'] ?? 'all'; // 'all', 'bengalbet', 'neextplay'
        $results = [];

        if ($target === 'all' || $target === 'bengalbet') {
            require_once __DIR__ . '/../bengalbet/process.php';
            $results['bengalbet'] = run_bengalbet_process(true);
        }

        if ($target === 'all' || $target === 'neextplay') {
            require_once __DIR__ . '/../neextplay/process.php';
            $results['neextplay'] = run_neextplay_process(true);
        }

        send_json_response([
            'success' => true,
            'message' => 'Database process routine executed successfully',
            'timestamp' => date('Y-m-d H:i:s'),
            'results' => $results
        ]);
        break;

    default:
        send_json_response(['success' => false, 'error' => "Unknown action: {$action}"], 400);
        break;
}
