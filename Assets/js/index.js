    // Custom smooth scrolling function
    function smoothScrollTo(targetPosition, duration = 800) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeInOutCubic = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            const currentPosition = startPosition + (distance * easeInOutCubic);
            window.scrollTo(0, currentPosition);
            
            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }
        
        // Cancel any existing animation
        if (window.scrollAnimationId) {
            cancelAnimationFrame(window.scrollAnimationId);
        }
        
        window.scrollAnimationId = requestAnimationFrame(animation);
    }
    
    // Smooth scrolling for navigation links
    function scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            const headerHeight = document.querySelector('.navbar').offsetHeight;
            const elementPosition = element.offsetTop - headerHeight - 20; // 20px extra spacing
            
            // Use custom smooth scroll animation
            smoothScrollTo(elementPosition, 800);
            
            // Update active nav link
            updateActiveNavLink(sectionId);
        }
    }
    
    function updateActiveNavLink(activeId) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        const activeLink = document.querySelector(`a[href="#${activeId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    
    // Initialize everything after DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // User profile dropdown functionality
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
        
        // Small delay to ensure all elements are rendered
        setTimeout(function() {
            // Handle navigation clicks
            const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('href').substring(1);
                    scrollToSection(sectionId);
                });
            });
            
            // Handle scroll to update active nav link based on current section
            window.addEventListener('scroll', function() {
                const sections = ['home', 'about', 'gallery', 'contact'];
                const scrollPosition = window.scrollY + 100; // Offset for header
                
                sections.forEach(sectionId => {
                    const element = document.getElementById(sectionId);
                    if (element) {
                        const elementTop = element.offsetTop;
                        const elementBottom = elementTop + element.offsetHeight;
                        
                        if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
                            updateActiveNavLink(sectionId);
                        }
                    }
                });
            });
        }, 100); // 100ms delay
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
    if (galleryItems && galleryItems.length > 0) {
        showSlide(0);
        const nextBtn = document.querySelector('.carousel-btn.next');
        const prevBtn = document.querySelector('.carousel-btn.prev');
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    }

    // Form submission
    var suggestionForm = document.querySelector('.suggestion-form form');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Thank you for your suggestion! We will review it and get back to you soon.');
            this.reset();
        });
    }

    // Book now buttons functionality
    document.querySelectorAll('.cta-button, .step-button').forEach(button => {
        button.addEventListener('click', function() {
            alert('Booking functionality will be implemented soon!');
        });
    });