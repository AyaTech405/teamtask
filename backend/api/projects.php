<?php
require_once __DIR__ . '/../config/db_connection.php';

$uid    = requireAuth();
$action = $_GET['action'] ?? '';

match($action) {
    'list'       => listProjects($uid),
    'get'        => getProject($uid, (int)($_GET['id'] ?? 0)),
    'create'     => createProject($uid),
    'update'     => updateProject($uid, (int)($_GET['id'] ?? 0)),
    'delete'     => deleteProject($uid, (int)($_GET['id'] ?? 0)),
    'add_member' => addMember($uid),
    'stats'      => getStats($uid, (int)($_GET['id'] ?? 0)),
    default      => jsonResponse(['error' => 'Action inconnue'], 400)
};

function isMember(PDO $db, int $projectId, int $uid): bool {
    $s = $db->prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?');
    $s->execute([$projectId, $uid]);
    return (bool)$s->fetch();
}

function listProjects(int $uid): void {
    $db   = getDB();
    $stmt = $db->prepare("
        SELECT p.*,
               u.name AS owner_name,
               COUNT(DISTINCT t.id) AS task_count,
               COALESCE(SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END), 0) AS done_count,
               COUNT(DISTINCT pm2.user_id) AS member_count
        FROM projects p
        JOIN project_members pm  ON pm.project_id  = p.id AND pm.user_id = ?
        JOIN users u             ON u.id = p.owner_id
        LEFT JOIN tasks t        ON t.project_id   = p.id
        LEFT JOIN project_members pm2 ON pm2.project_id = p.id
        GROUP BY p.id
        ORDER BY p.created_at DESC
    ");
    $stmt->execute([$uid]);
    jsonResponse($stmt->fetchAll());
}

function getProject(int $uid, int $pid): void {
    if (!$pid) jsonResponse(['error' => 'ID requis'], 422);
    $db = getDB();
    if (!isMember($db, $pid, $uid)) jsonResponse(['error' => 'Accès refusé'], 403);

    $stmt = $db->prepare("SELECT p.*, u.name AS owner_name FROM projects p JOIN users u ON u.id=p.owner_id WHERE p.id=?");
    $stmt->execute([$pid]);
    $project = $stmt->fetch();
    if (!$project) jsonResponse(['error' => 'Introuvable'], 404);

    $ms = $db->prepare("SELECT u.id, u.name, u.email, pm.role, pm.joined_at FROM project_members pm JOIN users u ON u.id=pm.user_id WHERE pm.project_id=?");
    $ms->execute([$pid]);
    $project['members'] = $ms->fetchAll();

    jsonResponse($project);
}

function createProject(int $uid): void {
    $d = getJsonBody();
    $name = trim($d['name'] ?? ''); $subject = trim($d['subject'] ?? '');
    if (!$name || !$subject) jsonResponse(['error' => 'Nom et matière requis'], 422);

    $db = getDB();
    $db->beginTransaction();
    try {
        $db->prepare("INSERT INTO projects (name,subject,description,color,deadline,owner_id) VALUES (?,?,?,?,?,?)")
           ->execute([$name, $subject, trim($d['description']??''), $d['color']??'#4F46E5', $d['deadline']??null, $uid]);
        $pid = (int)$db->lastInsertId();
        $db->prepare("INSERT INTO project_members (project_id,user_id,role) VALUES (?,?,'owner')")->execute([$pid,$uid]);
        $db->commit();
        jsonResponse(['success' => true, 'id' => $pid], 201);
    } catch(Exception $e) { $db->rollBack(); jsonResponse(['error' => 'Erreur création'], 500); }
}

function updateProject(int $uid, int $pid): void {
    if (!$pid) jsonResponse(['error' => 'ID requis'], 422);
    $db = getDB();
    $c = $db->prepare('SELECT 1 FROM projects WHERE id=? AND owner_id=?'); $c->execute([$pid,$uid]);
    if (!$c->fetch()) jsonResponse(['error' => 'Non autorisé'], 403);
    $d = getJsonBody();
    $db->prepare("UPDATE projects SET name=?,subject=?,description=?,color=?,deadline=? WHERE id=?")
       ->execute([trim($d['name']??''),trim($d['subject']??''),trim($d['description']??''),$d['color']??'#4F46E5',$d['deadline']??null,$pid]);
    jsonResponse(['success' => true]);
}

function deleteProject(int $uid, int $pid): void {
    if (!$pid) jsonResponse(['error' => 'ID requis'], 422);
    $db = getDB();
    $c = $db->prepare('SELECT 1 FROM projects WHERE id=? AND owner_id=?'); $c->execute([$pid,$uid]);
    if (!$c->fetch()) jsonResponse(['error' => 'Non autorisé'], 403);
    $db->prepare('DELETE FROM projects WHERE id=?')->execute([$pid]);
    jsonResponse(['success' => true]);
}

function addMember(int $uid): void {
    $d = getJsonBody();
    $pid = (int)($d['project_id']??0); $email = trim($d['email']??'');
    if (!$pid || !$email) jsonResponse(['error' => 'Champs requis'], 422);
    $db = getDB();
    $c = $db->prepare('SELECT 1 FROM projects WHERE id=? AND owner_id=?'); $c->execute([$pid,$uid]);
    if (!$c->fetch()) jsonResponse(['error' => 'Non autorisé'], 403);
    $u = $db->prepare('SELECT id, name FROM users WHERE email=?'); $u->execute([$email]);
    $member = $u->fetch();
    if (!$member) jsonResponse(['error' => 'Utilisateur introuvable'], 404);
    try {
        $db->prepare("INSERT INTO project_members (project_id,user_id,role) VALUES (?,?,'member')")->execute([$pid,$member['id']]);
        jsonResponse(['success'=>true,'member'=>$member], 201);
    } catch(PDOException $e) { jsonResponse(['error'=>'Déjà membre'], 409); }
}

function getStats(int $uid, int $pid): void {
    $db = getDB();
    if (!isMember($db,$pid,$uid)) jsonResponse(['error'=>'Accès refusé'], 403);
    $stmt = $db->prepare("SELECT COUNT(*) total, COALESCE(SUM(status='todo'), 0) todo, COALESCE(SUM(status='in_progress'), 0) in_progress, COALESCE(SUM(status='done'), 0) done, COALESCE(SUM(deadline < date('now') AND status != 'done'), 0) overdue FROM tasks WHERE project_id=?");
    $stmt->execute([$pid]);
    jsonResponse($stmt->fetch());
}
