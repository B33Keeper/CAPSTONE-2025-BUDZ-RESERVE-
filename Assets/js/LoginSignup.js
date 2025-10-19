// login scripts



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

//end of login scripts 

//signup scripts

    // Simple signup validation
    function validateSignup() {
      let isValid = true;
      
      // Get form elements
      let name = document.getElementById("name").value.trim();
      let age = document.getElementById("age").value;
      let sex = document.querySelector('input[name="sex"]:checked') ? document.querySelector('input[name="sex"]:checked').value : "";
      let username = document.getElementById("username").value.trim();
      let email = document.getElementById("email").value.trim();
      let password = document.getElementById("password").value;
      let confirmPassword = document.getElementById("confirmPassword").value;
      
      // Get error elements
      const nameErrorEl = document.getElementById("nameError");
      const ageErrorEl = document.getElementById("ageError");
      const sexErrorEl = document.getElementById("sexError");
      const usernameErrorEl = document.getElementById("usernameError");
      const emailErrorEl = document.getElementById("emailError");
      const passwordErrorEl = document.getElementById("passwordError");
      const confirmPasswordErrorEl = document.getElementById("confirmPasswordError");
      
      // Clear previous errors
      if (nameErrorEl) nameErrorEl.innerText = "";
      if (ageErrorEl) ageErrorEl.innerText = "";
      if (sexErrorEl) sexErrorEl.innerText = "";
      if (usernameErrorEl) usernameErrorEl.innerText = "";
      if (emailErrorEl) emailErrorEl.innerText = "";
      if (passwordErrorEl) passwordErrorEl.innerText = "";
      if (confirmPasswordErrorEl) confirmPasswordErrorEl.innerText = "";

      // Validate name
      if (name === "") {
        if (nameErrorEl) nameErrorEl.innerText = "Name is required.";
        isValid = false;
      }

      // Validate age
      if (age === "" || age < 1 || age > 120) {
        if (ageErrorEl) ageErrorEl.innerText = "Please enter a valid age (1-120).";
        isValid = false;
      }

      // Validate sex
      if (sex === "") {
        if (sexErrorEl) sexErrorEl.innerText = "Please select a gender.";
        isValid = false;
      }

      // Validate username
      if (username === "") {
        if (usernameErrorEl) usernameErrorEl.innerText = "Username is required.";
        isValid = false;
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email === "") {
        if (emailErrorEl) emailErrorEl.innerText = "Email is required.";
        isValid = false;
      } else if (!emailRegex.test(email)) {
        if (emailErrorEl) emailErrorEl.innerText = "Please enter a valid email address.";
        isValid = false;
      }

      // Complex password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]).{8,}$/;

      if (!strongPasswordRegex.test(password)) {
        if (passwordErrorEl) passwordErrorEl.innerText = "Password must be 8+ chars with upper, lower, number, and special.";
        isValid = false;
      }

      if (password !== confirmPassword) {
        if (confirmPasswordErrorEl) confirmPasswordErrorEl.innerText = "Passwords do not match.";
        isValid = false;
      }

      return isValid;
    }

// Popup utilities
function ensurePopupElements() {
  if (document.getElementById('popupOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'popupOverlay';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.background = 'rgba(0,0,0,0.5)';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '9999';

  const modal = document.createElement('div');
  modal.id = 'popupModal';
  modal.style.background = '#fff';
  modal.style.padding = '20px';
  modal.style.borderRadius = '8px';
  modal.style.maxWidth = '420px';
  modal.style.width = '90%';
  modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
  modal.style.fontFamily = 'inherit';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.textAlign = 'center';

  const messageEl = document.createElement('div');
  messageEl.id = 'popupMessage';
  messageEl.style.marginBottom = '16px';
  messageEl.style.textAlign = 'center';

  const button = document.createElement('button');
  button.id = 'popupCloseBtn';
  button.type = 'button';
  button.textContent = 'OK';
  button.style.padding = '10px 16px';
  button.style.background = '#0d6efd';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '6px';
  button.style.cursor = 'pointer';

  modal.appendChild(messageEl);
  modal.appendChild(button);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function showPopup(message, options) {
  ensurePopupElements();
  const overlay = document.getElementById('popupOverlay');
  const messageEl = document.getElementById('popupMessage');
  const closeBtn = document.getElementById('popupCloseBtn');

  messageEl.textContent = message || '';
  overlay.style.display = 'flex';

  function cleanup() {
    overlay.style.display = 'none';
    closeBtn.removeEventListener('click', onCloseInternal);
    overlay.removeEventListener('click', onOverlayClick);
    if (options && typeof options.onClose === 'function') {
      try { options.onClose(); } catch (e) {}
    }
    if (options && options.redirectUrl) {
      window.location.href = options.redirectUrl;
    }
  }

  function onCloseInternal() { cleanup(); }
  function onOverlayClick(e) { if (e.target === overlay) cleanup(); }

  closeBtn.addEventListener('click', onCloseInternal);
  overlay.addEventListener('click', onOverlayClick);
}

// end of signupscripts