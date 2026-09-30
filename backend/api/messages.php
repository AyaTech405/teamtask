<?php
require_once __DIR__ . '/../config/db_connection.php';

$uid    = requireAuth();
$action = $_GET['action'] ?? '';

match($action) {
    'list' => listMessages($uid, (int)($_GET['project_id'] ?? 0), $_GET['since'] ?? null),
    'send' => sendMessage($uid),
    default => jsonResponse(['error' => 'Action inconnue'], 400)
};

function isMember(PDO $db, int $pid, int $uid): bool {
    $s = $db->prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?');
    $s->execute([$pid, $uid]);
    return (bool)$s->fetch();
}

function listMessages(int $uid, int $pid, ?string $since): void {
    if (!$pid) jsonResponse(['error' => 'project_id requis'], 422);
    $db = getDB();
    if (!isMember($db, $pid, $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    if ($since) {
        $stmt = $db->prepare("
            SELECT m.id, m.content, m.created_at, u.name AS user_name, u.id AS user_id
            FROM messages m JOIN users u ON u.id = m.user_id
            WHERE m.project_id = ? AND m.created_at > ?
            ORDER BY m.created_at ASC LIMIT 100
        ");
        $stmt->execute([$pid, $since]);
        jsonResponse($stmt->fetchAll());
    } else {
        $stmt = $db->prepare("
            SELECT m.id, m.content, m.created_at, u.name AS user_name, u.id AS user_id
            FROM messages m JOIN users u ON u.id = m.user_id
            WHERE m.project_id = ?
            ORDER BY m.created_at DESC LIMIT 60
        ");
        $stmt->execute([$pid]);
        jsonResponse(array_reverse($stmt->fetchAll()));
    }
}

function sendMessage(int $uid): void {
    $d       = getJsonBody();
    $pid     = (int)($d['project_id'] ?? 0);
    $content = trim($d['content'] ?? '');
    if (!$pid || !$content) jsonResponse(['error' => 'Champs requis'], 422);
    if (strlen($content) > 2000) jsonResponse(['error' => 'Message trop long'], 422);

    $db = getDB();
    if (!isMember($db, $pid, $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $db->prepare('INSERT INTO messages (project_id, user_id, content) VALUES (?,?,?)')->execute([$pid, $uid, $content]);
    $mid  = (int)$db->lastInsertId();
    $stmt = $db->prepare("SELECT m.id, m.content, m.created_at, u.name AS user_name, u.id AS user_id FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?");
    $stmt->execute([$mid]);
    jsonResponse($stmt->fetch(), 201);
}
