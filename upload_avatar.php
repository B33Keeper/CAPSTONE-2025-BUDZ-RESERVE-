<?php
session_start();
header('Content-Type: application/json');
// Prevent PHP warnings/notices from breaking JSON responses
ini_set('display_errors', '0');

if (!isset($_SESSION['username'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
  exit();
}

require_once __DIR__ . '/db.php';

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'No file uploaded']);
  exit();
}

$file = $_FILES['avatar'];

// Determine mime type safely
function up_get_mime_type($path) {
  if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
      $type = finfo_file($finfo, $path);
      finfo_close($finfo);
      if ($type) { return $type; }
    }
  }
  if (function_exists('mime_content_type')) {
    $type = @mime_content_type($path);
    if ($type) { return $type; }
  }
  // Fallback: guess from extension
  $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  $map = ['jpg'=>'image/jpeg','jpeg'=>'image/jpeg','png'=>'image/png','gif'=>'image/gif','webp'=>'image/webp'];
  return $map[$ext] ?? 'application/octet-stream';
}

$allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$mime = up_get_mime_type($file['tmp_name']);
if (!isset($allowed[$mime])) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Invalid image type']);
  exit();
}

if ($file['size'] > 3 * 1024 * 1024) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'message' => 'Image too large (max 3MB)']);
  exit();
}

$ext = $allowed[$mime];
$username = $_SESSION['username'];
$dir = __DIR__ . '/Assets/uploads/avatars';
if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
$basename = $username . '_' . time() . '.' . $ext;
$destPath = $dir . '/' . $basename;
$publicPath = 'Assets/uploads/avatars/' . $basename;

if (!@move_uploaded_file($file['tmp_name'], $destPath)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Failed to move file']);
  exit();
}

$stmt = $conn->prepare('UPDATE users SET profile_picture = ? WHERE username = ?');
$stmt->bind_param('ss', $publicPath, $username);
if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'message' => 'Failed to save to DB']);
  exit();
}

echo json_encode(['ok' => true, 'avatar' => $publicPath]);
?>


