<?php
session_start();
session_destroy(); // end session
header("Location: login.php"); // redirect to login
exit();
?>
