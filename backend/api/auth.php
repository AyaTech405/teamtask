<?php
require_once __DIR__ . '/../config/db_connection.php';

$action = $_GET['action'] ?? '';

match($action) {
    'register'        => register(),
    'login'           => login(),
    'logout'          => logout(),
    'me'              => me(),
    'update_profile'  => updateProfile(),
    'change_password' => changePassword(),
    default           => jsonResponse(['error' => 'Action inconnue'], 400)
};

function register(): void {
    $d        = getJsonBody();
    $name     = trim($d['name']     ?? '');
    $email    = trim($d['email']    ?? '');
    $password = trim($d['password'] ?? '');

    if (!$name || !$email || !$password) jsonResponse(['error' => 'Champs requis manquants'], 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))   jsonResponse(['error' => 'Email invalide'], 422);
    if (strlen($password) < 6) jsonResponse(['error' => 'Mot de passe trop court (min 6)'], 422);

    $db = getDB();
    $chk = $db->prepare('SELECT id FROM users WHERE email = ?');
    $chk->execute([$email]);
    if ($chk->fetch()) jsonResponse(['error' => 'Email déjà utilisé'], 409);

    $db->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
       ->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT)]);

    jsonResponse(['success' => true, 'user' => [
        'id' => (int)$db->lastInsertId(), 'name' => $name, 'email' => $email
    ]], 201);
}

function login(): void {
    $d     = getJsonBody();
    $email = trim($d['email']    ?? '');
    $pass  = trim($d['password'] ?? '');

    if (!$email || !$pass) jsonResponse(['error' => 'Email et mot de passe requis'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT id, name, email, password FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($pass, $user['password'])) {
        jsonResponse(['error' => 'Identifiants incorrects'], 401);
    }

    $token = bin2hex(random_bytes(32));
    $exp   = date('Y-m-d H:i:s', strtotime('+30 days'));

    $db->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$user['id']]);
    $db->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
       ->execute([$user['id'], $token, $exp]);

    unset($user['password']);
    jsonResponse(['success' => true, 'token' => $token, 'user' => $user]);
}

function logout(): void {
    $uid = requireAuth();
    getDB()->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$uid]);
    jsonResponse(['success' => true]);
}

function me(): void {
    $uid  = requireAuth();
    $stmt = getDB()->prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    jsonResponse($stmt->fetch());
}

function updateProfile(): void {
    $uid  = requireAuth();
    $d    = getJsonBody();
    $name = trim($d['name'] ?? '');
    if (!$name) jsonResponse(['error' => 'Nom requis'], 422);

    $db = getDB();
    $db->prepare('UPDATE users SET name = ? WHERE id = ?')->execute([$name, $uid]);

    $stmt = $db->prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    jsonResponse(['success' => true, 'user' => $stmt->fetch()]);
}

function changePassword(): void {
    $uid = requireAuth();
    $d   = getJsonBody();
    $old = trim($d['old_password'] ?? '');
    $new = trim($d['new_password'] ?? '');

    if (!$old || !$new) jsonResponse(['error' => 'Champs requis'], 422);
    if (strlen($new) < 6) jsonResponse(['error' => 'Nouveau mot de passe trop court (min 6)'], 422);

    $db   = getDB();
    $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($old, $row['password'])) {
        jsonResponse(['error' => 'Ancien mot de passe incorrect'], 401);
    }

    $db->prepare('UPDATE users SET password = ? WHERE id = ?')
       ->execute([password_hash($new, PASSWORD_BCRYPT), $uid]);

    jsonResponse(['success' => true]);
}
