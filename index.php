<?php
session_start();

// If not logged in, redirect to login page
/* if (!isset($_SESSION['username'])) {
    header("Location: login.php");
    exit();
} */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budz Badminton Court - Home</title>
    <link href="https://fonts.googleapis.com/css2?family=Judson:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="Assets/styles/index_style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  
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
        <div class="container">
            <div class="logo">
                <img src="Assets/icons/BBC ICON.png" alt="BBC Logo">
                
            </div>
            <nav class="nav">
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About Us</a></li>
                    <li><a href="#gallery">Gallery</a></li>
                    <li><a href="#contact">Contact us</a></li>
                    <li><a href="Book.php" class="book-btn">Book a court</a></li>
                    <li><a href="#queue" class="queue-btn">Manage Queuing</a></li>
      </ul>
    </nav>

            <div class="user-profile">
                <div class="profile-info">
                    <img src="#" alt="Profile Picture" class="profile-pic">
                    <span class="username"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                </div>
                <div class="dropdown-menu">
                    <a href="#profile" class="dropdown-item">
                        <i class="fas fa-user"></i>
                        <span>Profile</span>
                    </a>
                    <a href="#reservations" class="dropdown-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>My Reservations</span>
                    </a>
                    <a href="logout.php" class="dropdown-item logout-item">
                        <i class="fas fa-power-off"></i>
                        <span>Log Out</span>
                    </a>
                </div>
            </div>
        </div>
    </header>

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
            <img src="Assets/img/home-page/header-background.png" alt="Badminton Court">
        </div>
        <div class="hero-content">
            <div class="container">
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
    </section>

    <!-- Why Choose Section -->
    <section class="why-choose">
        <div class="container">
            <h2 class="section-title">Why choose <span style="color: #3466B0;">Budz Badminton Court?</span></h2>
            <p class="section-description">
                We are dedicated to providing you with the best badminton experience. Our court is a space 
                where you can relieve stress, unleash your energy, and enjoy quality time with friends and family.
            </p>
            
            <div class="process-steps">
                <div class="step-card">
                    <div class="step-number">01</div>
                    <div class="step-icon">
                        <img src="Assets/icons/book icon.png" alt="Book Icon">
                    </div>
                    <h3>Book</h3>
                    <p>Experience our new 3-minute Booking System and be amazed!</p>
                    <button class="step-button">Book now</button>
                </div>
                
                <div class="step-card">
                    <div class="step-number">02</div>
                    <div class="step-icon">
                        <img src="Assets/icons/g-cash icon.png" alt="GCash Icon">
                    </div>
                    <h3>Pay</h3>
                    <p>Pay anytime, anywhere with your GCash e-wallet.</p>
                    <button class="step-button">Book now</button>
                </div>
                
                <div class="step-card">
                    <div class="step-number">03</div>
                    <div class="step-icon">
                        <img src="Assets/icons/playing badminton icon.png" alt="Playing Icon">
                    </div>
                    <h3>Play</h3>
                    <p>Play with your friends in our clean and well-maintained courts!</p>
                    <button class="step-button">Book now</button>
                </div>
            </div>
        </div>
    </section>

    <!-- Features and Statistics Section -->
    <section class="features-stats">
  <div class="container">
    <div class="features-content">
      
      <div class="features-graphic">
        <img src="Assets/img/home-page/a man spiking img.png" alt="Badminton Player">
      </div>
      
      <div class="stats-content">
        
        <div class="stat-item">
          <div class="stat-icon">
            <img src="Assets/icons/racket icon.png" alt="Racket Icon">
          </div>
          <div class="stat-info">
            <div class="stat-number">500</div>
            <p class="stat-text">Guests have already experienced what we offer.</p>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">
            <img src="Assets/icons/racket icon.png" alt="Racket Icon">
          </div>
          <div class="stat-info">
            <div class="stat-number">14</div>
            <p class="stat-text">Available Courts that are clean and well-maintained!</p>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">
            <img src="Assets/icons/racket icon.png" alt="Racket Icon">
          </div>
          <div class="stat-info">
            <div class="stat-number">135,000</div>
            <p class="stat-text">Countless hours dedicated to serving our valued clients.</p>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</section>

    <!-- Gallery Section -->
    <section id="gallery" class="gallery">
  <div class="container">
    <h2 class="section-title">Some Court And Client <span style="color: #3466B0;">Photos</span></h2>
    <p class="gallery-subtitle">Happiness and fun is with us! Take a look at some photos taken with our clients</p>
    
    <!-- Wrapper for two stacked carousels -->
    <div class="gallery-wrapper">
      
      <!-- First carousel -->
      <div class="gallery-carousel top-carousel">
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 1.jpg" alt="Client Group Photo 1">
        </div>
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 2.jpg" alt="Client Group Photo 2">
        </div>
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 3.jpg" alt="Client Group Photo 3">
        </div>
      </div>
      
      <!-- Second carousel -->
      <div class="gallery-carousel bottom-carousel">
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 4.jpg" alt="Client Group Photo 4">
        </div>
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 5.jpg" alt="Client Group Photo 5">
        </div>
        <div class="gallery-item">
          <img src="Assets/img/home-page/GALLERY/IMAGE 6.jpg" alt="Client Group Photo 6">
        </div>
      </div>
      
    </div>
    
    <!-- Shared carousel controls -->
    <div class="carousel-controls">
      <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
      <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>
</section>




     
    <!-- Contact and Footer Section LAST CHANGE-->
    <!-- ------------------ Paste this in place of your current footer/map/copyright ------------------ -->
<footer class="slanted-footer">
  <div class="footer-content">
    <div class="left-box">
      <h3>Send us your suggestions</h3>
      <form>
        <div class="form-group">
          <input type="text" placeholder="Name" required>
        </div>
        <div class="form-group">
          <textarea placeholder="Enter your suggestions here in order for us to improve our services:" required></textarea>
        </div>
        <button type="submit" class="send-btn">Send message</button>
      </form>
    </div>

    <div class="court-info">
      <h3>More About Budz Badminton Court</h3>
      <div class="social-links">
        <a href="https://www.facebook.com/budzbadmintoncourt" target="_blank">budzbadmintoncourt</a>
        <a href="https://www.facebook.com/budz.court" target="_blank">budz.court</a>
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

  <!-- MAP (kept INSIDE the footer so stacking is correct) -->
  <div class="map-container">
    <iframe 
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.123456789!2d120.987654321!3d14.123456789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sBudz%20Badminton%20Court!5e0!3m2!1sen!2sph!4v1234567890123!5m2!1sen!2sph"
      width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
    </iframe>
  </div>
  </footer>

  <div class="bottom-bar">
    © 2025 Budz Badminton Court. All Rights Reserved.
  </div>
  <script src="Assets/js/index.js"></script>

</body>
</html>
