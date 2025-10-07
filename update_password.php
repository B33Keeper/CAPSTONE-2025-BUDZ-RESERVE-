<?php
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'message' => 'Method not allowed']);
  exit();
}

if (!isset($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
  exit();
}

require_once __DIR__ . '/db.php';

$current = isset($_POST['current_password']) ? $_POST['current_password'] : '';
$new = isset($_POST['new_password']) ? $_POST['new_password'] : '';
$confirm = isset($_POST['confirm_password']) ? $_POST['confirm_password'] : '';

if (strlen($new) < 8) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'New password must be at least 8 characters.']);
  exit();
}

if ($new !== $confirm) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Passwords do not match.']);
  exit();
}

$username = $_SESSION['username'];

// Fetch current hash
$stmt = $conn->prepare('SELECT password FROM users WHERE username = ? LIMIT 1');
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
if (!$row = $result->fetch_assoc()) {
  http_response_code(404);
  echo json_encode(['ok' => false, 'message' => 'User not found']);
  exit();
}

$hash = $row['password'];
if (!password_verify($current, $hash)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Current password is incorrect.']);
  exit();
}

$newHash = password_hash($new, PASSWORD_DEFAULT);
$upd = $conn->prepare('UPDATE users SET password = ? WHERE username = ?');
$upd->bind_param('ss', $newHash, $username);
if (!$upd->execute()) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Failed to update password']);
  exit();
}

echo json_encode(['ok' => true, 'message' => 'Password updated successfully']);
?>


