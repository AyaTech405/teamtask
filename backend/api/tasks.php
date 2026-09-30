<?php
require_once __DIR__ . '/../config/db_connection.php';

$uid    = requireAuth();
$action = $_GET['action'] ?? '';

match($action) {
    'list'          => listTasks($uid, (int)($_GET['project_id'] ?? 0)),
    'create'        => createTask($uid),
    'update'        => updateTask($uid, (int)($_GET['id'] ?? 0)),
    'update_status' => updateStatus($uid),
    'delete'        => deleteTask($uid, (int)($_GET['id'] ?? 0)),
    'my_tasks'      => myTasks($uid),
    default         => jsonResponse(['error' => 'Action inconnue'], 400)
};

function isMember(PDO $db, int $pid, int $uid): bool {
    $s = $db->prepare('SELECT 1 FROM project_members WHERE project_id=? AND user_id=?');
    $s->execute([$pid, $uid]);
    return (bool)$s->fetch();
}

function listTasks(int $uid, int $pid): void {
    if (!$pid) jsonResponse(['error' => 'project_id requis'], 422);
    $db = getDB();
    if (!isMember($db, $pid, $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $stmt = $db->prepare("
        SELECT t.*, u.name AS assigned_name, c.name AS created_by_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to
        LEFT JOIN users c ON c.id = t.created_by
        WHERE t.project_id = ?
        ORDER BY
            CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
            t.deadline ASC,
            t.created_at DESC
    ");
    $stmt->execute([$pid]);
    jsonResponse($stmt->fetchAll());
}

function createTask(int $uid): void {
    $d   = getJsonBody();
    $pid = (int)($d['project_id'] ?? 0);
    $title = trim($d['title'] ?? '');
    if (!$pid || !$title) jsonResponse(['error' => 'Champs requis'], 422);

    $db = getDB();
    if (!isMember($db, $pid, $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $db->prepare("INSERT INTO tasks (project_id,title,description,status,priority,assigned_to,deadline,created_by) VALUES (?,?,?,?,?,?,?,?)")
       ->execute([
           $pid, $title,
           trim($d['description'] ?? ''),
           $d['status']      ?? 'todo',
           $d['priority']    ?? 'medium',
           isset($d['assigned_to']) && $d['assigned_to'] ? (int)$d['assigned_to'] : null,
           $d['deadline']    ?? null,
           $uid
       ]);
    jsonResponse(['success' => true, 'id' => (int)getDB()->lastInsertId()], 201);
}

function updateTask(int $uid, int $tid): void {
    if (!$tid) jsonResponse(['error' => 'ID requis'], 422);
    $db = getDB();
    $t  = $db->prepare('SELECT project_id FROM tasks WHERE id=?'); $t->execute([$tid]);
    $row = $t->fetch();
    if (!$row) jsonResponse(['error' => 'Introuvable'], 404);
    if (!isMember($db, $row['project_id'], $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $d = getJsonBody();
    $db->prepare("UPDATE tasks SET title=?,description=?,status=?,priority=?,assigned_to=?,deadline=?,updated_at=datetime('now') WHERE id=?")
       ->execute([
           trim($d['title'] ?? ''),
           trim($d['description'] ?? ''),
           $d['status']   ?? 'todo',
           $d['priority'] ?? 'medium',
           isset($d['assigned_to']) && $d['assigned_to'] ? (int)$d['assigned_to'] : null,
           $d['deadline'] ?? null,
           $tid
       ]);
    jsonResponse(['success' => true]);
}

function updateStatus(int $uid): void {
    $d      = getJsonBody();
    $tid    = (int)($d['id'] ?? 0);
    $status = $d['status'] ?? '';
    if (!$tid || !in_array($status, ['todo','in_progress','done'])) jsonResponse(['error' => 'Données invalides'], 422);

    $db = getDB();
    $t  = $db->prepare('SELECT project_id FROM tasks WHERE id=?'); $t->execute([$tid]);
    $row = $t->fetch();
    if (!$row || !isMember($db, $row['project_id'], $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $db->prepare("UPDATE tasks SET status=?,updated_at=datetime('now') WHERE id=?")->execute([$status, $tid]);
    jsonResponse(['success' => true]);
}

function deleteTask(int $uid, int $tid): void {
    if (!$tid) jsonResponse(['error' => 'ID requis'], 422);
    $db = getDB();
    $t  = $db->prepare('SELECT project_id, created_by FROM tasks WHERE id=?'); $t->execute([$tid]);
    $row = $t->fetch();
    if (!$row) jsonResponse(['error' => 'Introuvable'], 404);

    $own = $db->prepare("SELECT 1 FROM project_members WHERE project_id=? AND user_id=? AND role='owner'");
    $own->execute([$row['project_id'], $uid]);
    if ($row['created_by'] != $uid && !$own->fetch()) jsonResponse(['error' => 'Non autorisé'], 403);

    $db->prepare('DELETE FROM tasks WHERE id=?')->execute([$tid]);
    jsonResponse(['success' => true]);
}

function myTasks(int $uid): void {
    $stmt = getDB()->prepare("
        SELECT t.*, p.name AS project_name, p.color AS project_color
        FROM tasks t JOIN projects p ON p.id = t.project_id
        WHERE t.assigned_to = ? AND t.status != 'done'
        ORDER BY t.deadline ASC
    ");
    $stmt->execute([$uid]);
    jsonResponse($stmt->fetchAll());
}
