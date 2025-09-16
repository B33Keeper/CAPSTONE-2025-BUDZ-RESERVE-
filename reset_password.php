<?php
session_start();
include 'db.php';

// Guard: must have verified OTP
if (!isset($_SESSION['reset_verified']) || $_SESSION['reset_verified'] !== true || empty($_SESSION['reset_email'])) {
  echo "<script>window.addEventListener('DOMContentLoaded',function(){ showPopup('Please verify OTP first.', {redirectUrl:'forgot password.php'}); });</script>";
  // Do not exit yet so the HTML renders script
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $passwordPlain = isset($_POST['password']) ? $_POST['password'] : '';
  $confirmPasswordPlain = isset($_POST['confirmPassword']) ? $_POST['confirmPassword'] : '';
  $email = isset($_SESSION['reset_email']) ? $_SESSION['reset_email'] : '';

  // Strong password (same as signup): min 8, upper, lower, number, special
  $strongPasswordPattern = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/`~]).{8,}$/";

  if ($passwordPlain !== $confirmPasswordPlain) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ showPopup('Passwords do not match.'); });</script>";
  } else if (!preg_match($strongPasswordPattern, $passwordPlain)) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ showPopup('Password must be 8+ chars with upper, lower, number, and special.'); });</script>";
  } else if (!empty($email)) {
    $hashed = password_hash($passwordPlain, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE users SET password=? WHERE email=?");
    $stmt->bind_param("ss", $hashed, $email);
    if ($stmt->execute() && $stmt->affected_rows >= 0) {
      // Clear reset session flags
      unset($_SESSION['reset_otp'], $_SESSION['reset_otp_expires']);
      $_SESSION['reset_verified'] = false;
      echo "<script>window.addEventListener('DOMContentLoaded',function(){ showPopup('Password reset successful. Please log in.', {redirectUrl:'login.php'}); });</script>";
    } else {
      $err = addslashes($stmt->error);
      echo "<script>window.addEventListener('DOMContentLoaded',function(){ showPopup('Unable to update password: {$err}'); });</script>";
    }
    $stmt->close();
  }
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="Assets/styles/style.css">
  <script src="Assets/js/LoginSignup.js"></script>
  <title>Reset Password</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    /* Keep minimal inline to match existing pages' layout if needed */
  </style>
  
</head>
<body>

  <div class="login-container">
    <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">

    <form action="reset_password.php" method="POST" onsubmit="return validateSignup()">
      <input type="password" id="password" name="password" placeholder="New Password" required>
      <div id="passwordError" class="error"></div>

      <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm New Password" required>
      <div id="confirmPasswordError" class="error"></div>

      <br>
      <button type="submit">Reset Password</button>
    </form>

    <div class="links">
      <a href="login.php">Back to Login</a>
    </div>
  </div>

</body>
</html>


