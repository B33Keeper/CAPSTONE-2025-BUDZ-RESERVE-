<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="style.css">
  <title>BBC Sign Up</title>
</head>
<body>

  <div class="login-container">
    <img src="login photo/BBC.png" alt="BBC Logo">
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
      <span>Already have an account? <a href="index.php">Login</a></span>
    </div>
  </div>

  <script>
    // Simple signup validation
    function validateSignup() {
      let password = document.getElementById("password").value;
      let confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        document.getElementById("confirmPasswordError").innerText = "Passwords do not match.";
        return false;
      } else {
        document.getElementById("confirmPasswordError").innerText = "";
      }
      return true;
    }
  </script>

<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // Check if email or username already exists
    $check = $conn->prepare("SELECT id FROM users WHERE username=? OR email=?");
    $check->bind_param("ss", $username, $email);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        // Show popup alert and stay on signup page
        echo "<script>alert('Username or Email already taken'); window.history.back();</script>";
        exit();
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $password);

        if ($stmt->execute()) {
    // Show success alert and redirect to login page
    echo "<script>alert('Account created successfully'); window.location.href='index.php';</script>";
    exit();
}
 else {
            echo "<script>alert('Error: " . addslashes($stmt->error) . "'); window.history.back();</script>";
        }
        $stmt->close();
    }
    $check->close();
}
$conn->close();
?>


</body>
</html>

