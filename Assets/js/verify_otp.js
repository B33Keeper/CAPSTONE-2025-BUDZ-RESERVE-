function validateOTP() {
    const otp = document.getElementById("otp").value.trim();
    const error = document.getElementById("otpError");
    error.innerText = "";
    if (otp === "") {
      error.innerText = "OTP is required.";
      return false;
    }
    if (!/^\d{4,8}$/.test(otp)) {
      error.innerText = "OTP must be 4-8 digits.";
      return false;
    }
    return true;
  }