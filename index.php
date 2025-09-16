<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, password FROM users WHERE username=?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $hashedPassword);
        $stmt->fetch();

        if (password_verify($password, $hashedPassword)) {
          $_SESSION['user_id'] = $id;
          $_SESSION['username'] = $username;
          header("Location: samplehomepage.php?login=success");
          exit();
      }
      
       else {
            echo "<script>alert('Invalid username or password');</script>";
        }
    } else {
        echo "<script>alert('Invalid username or password');</script>";
    }
    $stmt->close();
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" type="text/css" href="style.css">
  <title>BBC Login</title>
</head>
<body>
  <div class="login-container">
    <img src="login photo/BBC.png" alt="BBC Logo">
    <form method="POST" action="index.php" onsubmit="return validateForm()">
      <input type="text" id="username" name="username" placeholder="Username" required>
      <div id="UsernameError" class="error"></div>

      <input type="password" id="password" name="password" placeholder="Password" required minlength="6">
      <div id="passwordError" class="error"></div>

      <br>
      <button type="submit">Login</button><br>
    </form>
    <div class="links">
      <a href="forgot password.html">Forgot password?</a>
      <br><br><br><br>
      <span>Don’t have an account yet? <a href="signup.php">Sign up</a></span>
    </div>
  </div>

  <script>
    function validateForm() {
      let isValid = true;
      let username = document.getElementById("username").value.trim();
      let password = document.getElementById("password").value.trim();

      document.getElementById("UsernameError").innerText = "";
      document.getElementById("passwordError").innerText = "";

      if (username === "") {
        document.getElementById("UsernameError").innerText = "Username is required.";
        isValid = false;
      }
      if (password === "") {
        document.getElementById("passwordError").innerText = "Password is required.";
        isValid = false;
      } else if (password.length < 6) {
        document.getElementById("passwordError").innerText = "Password must be at least 6 characters.";
        isValid = false;
      }
      return isValid;
    }
  </script>
</body>
</html>
