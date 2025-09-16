<?php
session_start();

// If not logged in, redirect to login page
if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Home - Budz Reserve</title>
  <link rel="stylesheet" href="login.css">
</head>
<body>

<?php
// ✅ Show popup if redirected after login
if (isset($_GET['login']) && $_GET['login'] === 'success') {
    echo "<script>alert('Login Successfully');</script>";
}
?>

  <div class="login-container">
    <h2>Welcome, <?php echo htmlspecialchars($_SESSION['username']); ?> 🎉</h2>
    <p>You have successfully logged in to <strong>Budz Reserve</strong>.</p>

    <nav>
      <ul>
        <li><a href="#">🏸 Reserve a Court</a></li>
        <li><a href="#">📅 My Reservations</a></li>
        <li><a href="#">⚙️ Account Settings</a></li>
      </ul>
    </nav>

    <br>
    <a href="logout.php" style="color:red; font-weight:bold;">Logout</a>
  </div>
</body>
</html>
