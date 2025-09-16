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
            echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Invalid username or password'); } else { alert('Invalid username or password'); } });</script>";
        }
    } else {
        echo "<script>window.addEventListener('DOMContentLoaded',function(){ if(typeof showPopup==='function'){ showPopup('Invalid username or password'); } else { alert('Invalid username or password'); } });</script>";
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
  <link rel="stylesheet" type="text/css" href="Assets/styles/style.css">
  <script src="Assets/js/LoginSignup.js"></script>
 
  <title>BBC Login</title>
</head>



<body>
  <div class="login-container">
    <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">
    <form method="POST" action="login.php" onsubmit="return validateForm()">
      <input type="text" id="username" name="username" placeholder="Username" required>
      <div id="UsernameError" class="error"></div>

      <input type="password" id="password" name="password" placeholder="Password" required minlength="6">
      <div id="passwordError" class="error"></div>

      <br>
      <button type="submit">Login</button><br>
    </form>
    <div class="links">
      <a href="forgot password.php">Forgot password?</a>
      <br><br><br><br>
      <span>Don’t have an account yet? <a href="signup.php">Sign up</a></span>
    </div>
  </div>

</body>
</html>
