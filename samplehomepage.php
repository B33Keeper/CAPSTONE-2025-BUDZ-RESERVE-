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
  <script src="Assets/js/LoginSignup.js"></script>
</head>
<body>

<?php
// ✅ Show popup if redirected after login
if (isset($_GET['login']) && $_GET['login'] === 'success') {
    echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Login Successfully')});})();</script>";
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
