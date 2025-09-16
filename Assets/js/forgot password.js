function validateEmail() {
    const email = document.getElementById("email").value.trim();
    const error = document.getElementById("emailError");
    error.innerText = "";

    if (email === "") {
      error.innerText = "Email is required.";
      return false;
    }
    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/i;
    if (!emailPattern.test(email)) {
      error.innerText = "Please enter a valid email address.";
      return false;
    }
    return true;
  }