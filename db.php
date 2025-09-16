<?php
$servername = "localhost";   // usually localhost
$dbusername = "root";        // your MySQL username
$dbpassword = "";            // your MySQL password
$dbname = "budz_reserve";    // updated database name

$conn = new mysqli($servername, $dbusername, $dbpassword, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>

