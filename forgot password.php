<?php
session_start();
require_once __DIR__ . '/Assets/lib/mailer.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $email = isset($_POST['email']) ? trim($_POST['email']) : '';
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Please enter a valid email address'); } else { alert('Please enter a valid email address'); } });</script>";
    exit();
  }

  // Generate 6-digit OTP and expiry (15 minutes)
  $otp = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
  $_SESSION['reset_email'] = $email;
  $_SESSION['reset_otp'] = $otp;
  $_SESSION['reset_otp_expires'] = time() + 900; // 15 minutes

  // Send via PHPMailer helper
  sendOTPEmail($email, $otp);

  echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('OTP sent to " . addslashes($email) . "',{redirectUrl:'verify_otp.php'}); } else { alert('OTP sent to " . addslashes($email) . "'); window.location.href='verify_otp.php'; } });</script>";
  exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="Assets/styles/style.css">
  <title>Forgot Password</title>
  <script src="Assets/js/LoginSignup.js"></script>
  <script src="Assets/js/forgot password.js"></script>
</head>
<body>

  <div class="login-container">
    <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">

    <form action="forgot password.php" method="POST" onsubmit="return validateEmail()">
      <div class="input-container">
        <i class="fa fa-envelope"></i>
        <input type="email" id="email" name="email" placeholder="Enter Email Address" required>
      </div>
      <div id="emailError" class="error"></div>
              <br>
      <button type="submit">Send OTP</button>
    </form>
           <br><br>
    <div class="links">
      <a href="login.php">Back to Login</a>
    </div>
  </div>

  

</body>
</html>
