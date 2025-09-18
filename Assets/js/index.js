       // User profile dropdown functionality
       document.addEventListener('DOMContentLoaded', function() {
        const userProfile = document.querySelector('.user-profile');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (userProfile && dropdownMenu) {
            userProfile.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!userProfile.contains(e.target)) {
                    dropdownMenu.classList.remove('show');
                }
            });
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Gallery carousel functionality
    let currentSlide = 0;
    const galleryItems = document.querySelectorAll('.gallery-item');
    const totalSlides = galleryItems.length;

    function showSlide(index) {
        galleryItems.forEach((item, i) => {
            item.style.display = i === index ? 'block' : 'none';
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    // Initialize carousel
    if (galleryItems.length > 0) {
        showSlide(0);
        
        document.querySelector('.carousel-btn.next').addEventListener('click', nextSlide);
        document.querySelector('.carousel-btn.prev').addEventListener('click', prevSlide);
    }

    // Form submission
    document.querySelector('.suggestion-form form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your suggestion! We will review it and get back to you soon.');
        this.reset();
    });

    // Book now buttons functionality
    document.querySelectorAll('.cta-button, .step-button').forEach(button => {
        button.addEventListener('click', function() {
            alert('Booking functionality will be implemented soon!');
        });
    });