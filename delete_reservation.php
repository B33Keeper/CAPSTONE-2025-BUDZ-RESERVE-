<?php
session_start();
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'message'=>'Method not allowed']); exit(); }
if (!isset($_SESSION['username'])) { http_response_code(401); echo json_encode(['ok'=>false,'message'=>'Not authenticated']); exit(); }
require_once __DIR__ . '/db.php';

$id = isset($_POST['reservation_id']) ? (int)$_POST['reservation_id'] : 0;
if ($id <= 0) { http_response_code(400); echo json_encode(['ok'=>false,'message'=>'Invalid reservation id']); exit(); }

// Ensure the reservation belongs to the logged-in user
$u = $_SESSION['username'];
$uid = 0;
if ($stmt = $conn->prepare('SELECT id FROM users WHERE username = ? LIMIT 1')) {
  $stmt->bind_param('s', $u);
  $stmt->execute();
  $res = $stmt->get_result();
  if ($row = $res->fetch_assoc()) { $uid = (int)$row['id']; }
  $stmt->close();
}
if ($uid <= 0) { http_response_code(401); echo json_encode(['ok'=>false,'message'=>'User not found']); exit(); }

// Delete only if owned by the user
$del = $conn->prepare('DELETE FROM reservations WHERE Reservation_ID = ? AND User_ID = ?');
$del->bind_param('ii', $id, $uid);
if (!$del->execute()) { http_response_code(500); echo json_encode(['ok'=>false,'message'=>'Failed to delete']); exit(); }

echo json_encode(['ok'=> ($del->affected_rows > 0)]);
?>


