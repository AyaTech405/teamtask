<?php
/**
 * Connexion PDO SQLite - Singleton
 */

function getDatabasePath(): string {
    $envPath = getenv('TEAMTASK_DB_PATH');
    if ($envPath) return $envPath;

    $databaseDir = realpath(__DIR__ . '/../../database') ?: (__DIR__ . '/../../database');
    return $databaseDir . DIRECTORY_SEPARATOR . 'teamtask.db';
}

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
                jsonResponse([
                    'error' => 'SQLite driver missing',
                    'message' => 'Enable the pdo_sqlite extension in php.ini, then restart TeamTask.'
                ], 500);
            }

            $dbPath = getDatabasePath();
            $dbDir = dirname($dbPath);
            if (!is_dir($dbDir)) mkdir($dbDir, 0775, true);

            $pdo = new PDO('sqlite:' . $dbPath, null, null, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            $pdo->exec('PRAGMA foreign_keys = ON');
            $pdo->exec('PRAGMA busy_timeout = 5000');
        } catch (PDOException $e) {
            jsonResponse([
                'error' => 'Database Connection Failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    return $pdo;
}

function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getJsonBody(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function requireAuth(): int {
    $headers = getallheaders();
    $token   = $headers['X-Auth-Token'] ?? $headers['x-auth-token'] ?? '';

    if (!$token) jsonResponse(['error' => 'Non authentifie'], 401);

    $stmt = getDB()->prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?');
    $stmt->execute([$token]);
    $s = $stmt->fetch();

    if (!$s || strtotime($s['expires_at']) < time()) {
        jsonResponse(['error' => 'Session expiree'], 401);
    }
    return (int) $s['user_id'];
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    exit;
}
