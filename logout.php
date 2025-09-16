<?php
session_start();
session_destroy(); // end session
header("Location: index.php"); // redirect to login
exit();
?>
