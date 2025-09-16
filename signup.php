

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
        echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Passwords do not match')});})();</script>";
        exit();
    }

    if (!preg_match($strongPasswordPattern, $passwordPlain)) {
        echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Password must be 8+ chars with upper, lower, number, and special.')});})();</script>";
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
        echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Username or Email already taken')});})();</script>";
        exit();
    } else {
        $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $password);

        if ($stmt->execute()) {
            // Show success popup then redirect to login page
            echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Account created successfully',{redirectUrl:'login.php'})});})();</script>";
            exit();
        }
        else {
            echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Error: " . addslashes($stmt->error) . "')});})();</script>";
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

