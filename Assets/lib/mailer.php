<?php
// Uses PHPMailer from Composer vendor if available, else falls back to SAAD path

$vendorBase = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'phpmailer' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR;
$saadBase = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'SAAD' . DIRECTORY_SEPARATOR . 'PHPMailer' . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR;

$phpmailerPath = file_exists($vendorBase . 'PHPMailer.php') ? $vendorBase : $saadBase;

require_once $phpmailerPath . 'PHPMailer.php';
require_once $phpmailerPath . 'SMTP.php';
require_once $phpmailerPath . 'Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendOTPEmail($to_email, $otp) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'zhiky090924@gmail.com';
        $mail->Password = 'enwozoebljossqqf';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        // Recipients
        $mail->setFrom('zhiky090924@gmail.com', 'Budz Badminton');
        $mail->addAddress($to_email);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Password Reset OTP - Budz Badminton';
        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2 style='color: #2196F3;'>Password Reset Request</h2>
                <p>Hello,</p>
                <p>You have requested to reset your password for your Budz Badminton account.</p>
                <p style='font-size: 24px; background: #f5f5f5; padding: 10px; text-align: center; letter-spacing: 5px;'>
                    Your OTP: <strong>{$otp}</strong>
                </p>
                <p><strong>Note:</strong> This OTP will expire in 15 minutes.</p>
                <p style='color: #666; font-size: 12px;'>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                <hr>
                <p style='color: #666; font-size: 12px; text-align: center;'>
                    This is an automated email from Budz Badminton Court Reservation System.
                </p>
            </div>
        ";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>


