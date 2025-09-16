<?php
session_start();

// If user opens the page directly and no OTP is in session, prompt to request a new code
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (empty($_SESSION['reset_otp']) || empty($_SESSION['reset_otp_expires'])) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('No OTP found. Please request a new code.', {redirectUrl:'forgot password.php'}); } else { alert('No OTP found. Please request a new code.'); window.location.href='forgot password.php'; } });</script>";
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $otp = isset($_POST['otp']) ? trim($_POST['otp']) : '';
  $sessionOtp = isset($_SESSION['reset_otp']) ? $_SESSION['reset_otp'] : null;
  $expires = isset($_SESSION['reset_otp_expires']) ? (int)$_SESSION['reset_otp_expires'] : 0;

  if (!$sessionOtp) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('No OTP found. Please request a new code.', {redirectUrl:'forgot password.php'}); } else { alert('No OTP found. Please request a new code.'); window.location.href='forgot password.php'; } });</script>";
    exit();
  }

  if (time() > $expires) {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('OTP expired. Please request a new code.', {redirectUrl:'forgot password.php'}); } else { alert('OTP expired. Please request a new code.'); window.location.href='forgot password.php'; } });</script>";
    exit();
  }

  if (hash_equals((string)$sessionOtp, (string)$otp)) {
    $_SESSION['reset_verified'] = true;
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('OTP verified. You can now reset your password.', {redirectUrl:'reset_password.php'}); } else { alert('OTP verified. You can now reset your password.'); window.location.href='reset_password.php'; } });</script>";
    exit();
  } else {
    echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Invalid OTP. Please try again.'); } else { alert('Invalid OTP. Please try again.'); } });</script>";
    // fall through to render form again
  }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="Assets/styles/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <title>Verify OTP</title>
  <script src="Assets/js/LoginSignup.js"></script>
  <script src="Assets/js/verify_otp.js"></script>
</head>
<body>

  <div class="login-container">
    <img src="login photo/BBC.png" alt="BBC Logo">

    <form action="verify_otp.php" method="POST" onsubmit="return validateOTP()">
      <div class="input-container">
        <i class="fa fa-key"></i>
        <input type="text" id="otp" name="otp" placeholder="     Enter One Time Password" required>
      </div>
      <div id="otpError" class="error"></div>

      <p>We sent you a code to: <b>Samplemail@gmail.com</b></p>
      <p><a href="resend_otp.php">Didn’t get a code?</a></p>

      <button type="submit">Confirm</button>
    </form>

    <div class="links">
      <a href="login.php">Back to Login</a>
    </div>
  </div>



</body>
</html>
