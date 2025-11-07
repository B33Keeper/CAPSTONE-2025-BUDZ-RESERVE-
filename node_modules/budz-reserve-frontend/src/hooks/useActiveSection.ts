import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useActiveSection(offset: number = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // If on the booking page, no section should be active
    if (location.pathname === '/booking') {
      setActiveSection(null);
      return;
    }

    const sectionIds = ['home', 'about', 'gallery', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: `-${offset}px 0px -${window.innerHeight - offset}px 0px`,
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [offset, location.pathname]); // Re-run effect if pathname changes

  return activeSection;
}