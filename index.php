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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budz Badminton Court - Home</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="Assets/styles/index_style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="stylesheet" type="text/css" href="Assets/styles/user_profile.css">
    <link rel="stylesheet" type="text/css" href="Assets/styles/reservations.css">
  
</head>
<body>
<?php
    // Show popup if redirected after login
if (isset($_GET['login']) && $_GET['login'] === 'success') {
    echo "<script>(function(){function e(){if(document.getElementById('popupOverlay'))return;var e=document.createElement('div');e.id='popupOverlay',e.style.position='fixed',e.style.inset='0',e.style.background='rgba(0,0,0,0.5)',e.style.display='none',e.style.alignItems='center',e.style.justifyContent='center',e.style.zIndex='9999';var t=document.createElement('div');t.id='popupModal',t.style.background='#fff',t.style.padding='20px',t.style.borderRadius='8px',t.style.maxWidth='420px',t.style.width='90%',t.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)',t.style.fontFamily='inherit',t.style.display='flex',t.style.flexDirection='column',t.style.alignItems='center',t.style.textAlign='center';var o=document.createElement('div');o.id='popupMessage',o.style.marginBottom='16px',o.style.textAlign='center';var n=document.createElement('button');n.id='popupCloseBtn',n.type='button',n.textContent='OK',n.style.padding='10px 16px',n.style.background='#0d6efd',n.style.color='#fff',n.style.border='none',n.style.borderRadius='6px',n.style.cursor='pointer',t.appendChild(o),t.appendChild(n),e.appendChild(t),document.body.appendChild(e)}window.showPopup=window.showPopup||function(t,o){e();var n=document.getElementById('popupOverlay'),d=document.getElementById('popupMessage'),i=document.getElementById('popupCloseBtn');function r(){n.style.display='none',i.removeEventListener('click',s),n.removeEventListener('click',l),o&&'function'==typeof o.onClose&&function(){try{o.onClose()}catch(e){}}(),o&&o.redirectUrl&&(window.location.href=o.redirectUrl)}function s(){r()}function l(e){e.target===n&&r()}d.textContent=t||'',n.style.display='flex',i.addEventListener('click',s),n.addEventListener('click',l)};window.addEventListener('DOMContentLoaded',function(){showPopup('Login Successfully')});})();</script>";
}
?>

    <!-- Header -->
    <header class="header">
        <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top">
            <div class="container-fluid">
                <!-- Logo -->
                <a class="navbar-brand" href="#home">
                    <img src="Assets/icons/BBC ICON.png" alt="BBC Logo" class="logo-img">
                </a>
                
                <!-- Mobile Toggle Button -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation Menu -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav mx-auto">
                        <li class="nav-item">
                            <a class="nav-link active" href="#home">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#about">About Us</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#gallery">Gallery</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#contact">Contact us</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link book-btn" href="Book.php">Book a court</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link queue-btn" href="#" onclick="alert('Queue management coming soon!')">Manage Queuing</a>
                        </li>
                    </ul>
                    
                    <!-- User Profile Dropdown -->
                    <div class="dropdown">
                        <a class="dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <?php
                            require_once __DIR__ . '/db.php';
                            $navAvatar = '';
                            if (isset($_SESSION['username'])) {
                                $u = $_SESSION['username'];
                                if ($stmt = $conn->prepare("SELECT profile_picture FROM users WHERE username = ? LIMIT 1")) {
                                    $stmt->bind_param("s", $u);
                                    if ($stmt->execute()) {
                                        $res = $stmt->get_result();
                                        if ($row = $res->fetch_assoc()) {
                                            $navAvatar = !empty($row['profile_picture']) ? $row['profile_picture'] : '';
                                        }
                                    }
                                    $stmt->close();
                                }
                            }
                            $navAvatar = $navAvatar !== '' ? $navAvatar : 'Assets/img/home-page/Ellipse 1.png';
                            ?>
                            <img src="<?php echo htmlspecialchars($navAvatar); ?>" alt="Profile Picture" class="profile-pic me-2" onerror="this.onerror=null;this.src='Assets/img/home-page/Ellipse 1.png';">
                            <span class="username"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item js-up-open" href="#">
                                <i class="fas fa-user me-2"></i>Profile
                            </a></li>
                            <li><a class="dropdown-item js-resv-open" href="#">
                                <i class="fas fa-calendar-check me-2"></i>My Reservations
                            </a></li>
                            <li><a class="dropdown-item js-history-open" href="#">
                                <i class="fas fa-clock me-2"></i>Reservation History
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item logout-item" href="logout.php">
                                <i class="fas fa-power-off me-2"></i>Log Out
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </nav>
    </header>

    <?php include __DIR__ . '/user_profile_modal.php'; ?>
    <?php include __DIR__ . '/reservations_modal.php'; ?>

    <!-- Floating Decorative Elements -->
    <div class="floating-elements">
        <div class="floating-ellipse ellipse-1"></div>
        <div class="floating-ellipse ellipse-2"></div>
        <div class="floating-ellipse ellipse-3"></div>
        <div class="floating-ellipse ellipse-4"></div>
        <div class="floating-ellipse ellipse-5"></div>
    </div>

    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="hero-background">
            <img src="Assets/img/home-page/header-background.png" alt="Badminton Court" class="img-fluid">
        </div>
        <div class="hero-content">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-12 col-lg-10 col-xl-8 text-center">
                        <h1 class="hero-title">Budz Badminton Court</h1>
                        <p class="hero-subtitle">Where dedication takes flight and champions are made</p>
                        <p class="hero-description">
                            Budz Badminton Court is open daily, with court hours from 8:00 AM to 12 Midnight. 
                            For reservations, kindly click the 'Book Now' and accomplish our online booking facility. 
                            Thank you, and we look forward to see you in the court!
                        </p>
                        <button class="cta-button">Book now</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Why Choose Section -->
    <section id="about" class="why-choose">
        <div class="container">
            <h2 class="section-title">Why choose Budz Badminton Court?</h2>
            <p class="section-description">
                We are dedicated to providing you with the best badminton experience. Our court is a space 
                where you can relieve stress, unleash your energy, and enjoy quality time with friends and family.
            </p>
            
            <div class="row g-4">
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="step-card">
                        <div class="step-number">01</div>
                        <div class="step-icon">
                            <img src="Assets/icons/book icon.png" alt="Book Icon" class="img-fluid">
                        </div>
                        <h3>Book</h3>
                        <p>Experience our new 3-minute Booking System and be amazed!</p>
                        <button class="step-button">Book now</button>
                    </div>
                </div>
                
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="step-card">
                        <div class="step-number">02</div>
                        <div class="step-icon">
                            <img src="Assets/icons/g-cash icon.png" alt="GCash Icon" class="img-fluid">
                        </div>
                        <h3>Pay</h3>
                        <p>Pay anytime, anywhere with your GCash e-wallet.</p>
                        <button class="step-button">Book now</button>
                    </div>
                </div>
                
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="step-card">
                        <div class="step-number">03</div>
                        <div class="step-icon">
                            <img src="Assets/icons/playing badminton icon.png" alt="Playing Icon" class="img-fluid">
                        </div>
                        <h3>Play</h3>
                        <p>Play with your friends in our clean and well-maintained courts!</p>
                        <button class="step-button">Book now</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features and Statistics Section -->
    <section class="features-stats">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-12 col-lg-6">
                    <div class="features-graphic">
                        <img src="Assets/img/home-page/a man spiking img.png" alt="Badminton Player" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-lg-6">
                    <div class="stats-content">
                        <div class="stat-item mb-4">
                            <div class="stat-icon">
                                <img src="Assets/icons/racket icon.png" alt="Racket Icon" class="img-fluid">
                            </div>
                            <p>500 Guests have already experienced what we offer.</p>
                        </div>
                        <div class="stat-item mb-4">
                            <div class="stat-icon">
                                <img src="Assets/icons/racket icon.png" alt="Racket Icon" class="img-fluid">
                            </div>
                            <p>14 Available Courts that are clean and well-maintained!</p>
                        </div>
                        <div class="stat-item mb-4">
                            <div class="stat-icon">
                                <img src="Assets/icons/racket icon.png" alt="Racket Icon" class="img-fluid">
                            </div>
                            <p>135,000 Countless hours dedicated to serving our valued clients.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="gallery">
        <div class="container">
            <h2 class="section-title">Some Court And Client Photos</h2>
            <p class="gallery-subtitle">Happiness and fun is with us! Take a look at some photos taken with our clients</p>
            
            <div class="row g-3">
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 1.jpg" alt="Client Group Photo 1" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 2.jpg" alt="Client Group Photo 2" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 3.jpg" alt="Client Group Photo 3" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 4.jpg" alt="Client Group Photo 4" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 5.jpg" alt="Client Group Photo 5" class="img-fluid">
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-lg-4">
                    <div class="gallery-item">
                        <img src="Assets/img/home-page/GALLERY/IMAGE 6.jpg" alt="Client Group Photo 6" class="img-fluid">
                    </div>
                </div>
            </div>
            
            <div class="carousel-controls">
                <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
                <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
    </section>

    <!-- Contact and Footer Section -->
    <section id="contact" class="contact-footer">
        <div class="container">
            <div class="row">
                <div class="col-12 col-lg-6">
                    <div class="suggestion-form">
                        <h3>Send us your suggestions</h3>
                        <form>
                            <div class="mb-3">
                                <input type="text" class="form-control" placeholder="Name" required>
                            </div>
                            <div class="mb-3">
                                <textarea class="form-control" placeholder="Enter your suggestions here in order for us to improve our services:" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary send-btn">Send message</button>
                        </form>
                    </div>
                </div>
                
                <div class="col-12 col-lg-6">
                    <div class="court-info">
                        <h3>More About Budz Badminton Court</h3>
                        <div class="social-links">
                            <a href="https://www.facebook.com/budzbadmintoncourt" target="_blank">https://www.facebook.com/budzbadmintoncourt</a>
                            <a href="https://www.facebook.com/budz.court" target="_blank">https://www.facebook.com/budz.court</a>
                        </div>
                        <div class="location">
                            <p><i class="fas fa-map-marker-alt"></i> 4th Floor RFC Mall Molino 2 Bacoor City Cavite</p>
                        </div>
                        <div class="contact-numbers">
                            <p><i class="fas fa-phone"></i> 09153730100 Globe</p>
                            <p><i class="fas fa-phone"></i> 09086688758 Smart</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Google Maps Section -->
    <section class="map-section">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-12 col-lg-10">
                    <div class="map-container">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.123456789!2d120.987654321!3d14.123456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBudz%20Badminton%20Court!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph"
                            width="100%" 
                            height="400" 
                            style="border:0;" 
                            allowfullscreen="" 
                            loading="lazy" 
                            referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Copyright -->
    <footer class="copyright">
        <div class="container">
            <p>&copy; 2025 Budz Badminton Court. All Rights Reserved.</p>
  </div>
    </footer>
  <script src="Assets/js/index.js"></script>
  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="Assets/js/user_profile.js"></script>
  <script src="Assets/js/reservations.js"></script>

  <!-- App Feedback Modal -->
  <div class="modal fade" id="appFeedbackModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-body text-center" id="appFeedbackBody"></div>
        <div class="p-3 text-center">
          <button type="button" class="btn btn-primary px-4" data-bs-dismiss="modal">OK</button>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
