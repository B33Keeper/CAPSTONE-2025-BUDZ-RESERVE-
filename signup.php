

<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $passwordPlain = isset($_POST['password']) ? $_POST['password'] : '';
    $confirmPasswordPlain = isset($_POST['confirmPassword']) ? $_POST['confirmPassword'] : '';

    // Server-side password validation: min 8, upper, lower, number, special
    $strongPasswordPattern = "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/`~]).{8,}$/";

    if ($passwordPlain !== $confirmPasswordPlain) {
        echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Passwords do not match'); } else { alert('Passwords do not match'); } });</script>";
        exit();
    }

    if (!preg_match($strongPasswordPattern, $passwordPlain)) {
        echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Password must be 8+ chars with upper, lower, number, and special.'); } else { alert('Password must be 8+ chars with upper, lower, number, and special.'); } });</script>";
        exit();
    }

    $password = password_hash($passwordPlain, PASSWORD_DEFAULT);

    // Check if email or username already exists
    $check = $conn->prepare("SELECT id FROM users WHERE username=? OR email=?");
    $check->bind_param("ss", $username, $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        // Show popup and stay on signup page
        echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Username or Email already taken'); } else { alert('Username or Email already taken'); } });</script>";
        exit();
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $password);

        if ($stmt->execute()) {
            // Show success popup then redirect to login page
            echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Account created successfully',{redirectUrl:'login.php'}); } else { alert('Account created successfully'); window.location.href='login.php'; } });</script>";
            exit();
        }
        else {
            echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Error: " . addslashes($stmt->error) . "'); } else { alert('Error: " . addslashes($stmt->error) . "'); } });</script>";
        }
        $stmt->close();
    }
    $check->close();
}
$conn->close();
?>


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="Assets/styles/style.css">
  <title>BBC Sign Up</title>
</head>
<body>

  <div class="login-container">
    <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">
    <form action="signup.php" method="POST" onsubmit="return validateSignup()">
      <input type="text" id="username" name="username" placeholder="Username" required>
      <div id="usernameError" class="error"></div>

      <input type="password" id="password" name="password" placeholder="Password" required minlength="6">
      <div id="passwordError" class="error"></div>

      <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Retype Password" required>
      <div id="confirmPasswordError" class="error"></div>

      <input type="email" id="email" name="email" placeholder="Email" required>
      <div id="emailError" class="error"></div>

      <br>
      <button type="submit">Sign Up</button><br>
    </form>

    <div class="links">
      <span>Already have an account? <a href="login.php">Login</a></span>
    </div>
  </div>

 <script src="Assets/js/LoginSignup.js"></script>
</body>
</html>

