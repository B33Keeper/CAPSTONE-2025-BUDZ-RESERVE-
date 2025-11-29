import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useActiveSection(offset: number = 100) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const location = useLocation();
  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    // If on pages that aren't the home page, no section should be active
    const excludedPaths = ['/booking', '/login', '/signup', '/signup/', '/queueing', '/payment-success', '/payment-failed'];
    if (excludedPaths.some(path => location.pathname === path || location.pathname.startsWith(path))) {
      setActiveSection(null);
      return;
    }

    const sectionIds = ['home', 'about', 'gallery', 'contact'];
    
    // Cache window.innerHeight to prevent forced reflow during observer setup
    // Read it once and cache it to avoid multiple layout reads
    const cachedInnerHeight = window.innerHeight;
    
    const observerOptions = {
      root: null,
      rootMargin: `-${offset}px 0px -${cachedInnerHeight - offset}px 0px`,
      threshold: 0,
    };

    // Throttled state update function using requestAnimationFrame
    const updateActiveSection = (sectionId: string) => {
      // Cancel any pending update
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      // Store the pending update
      pendingUpdateRef.current = sectionId;
      
      // Schedule the update in the next frame to batch with other updates
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingUpdateRef.current !== null) {
          setActiveSection(pendingUpdateRef.current);
          pendingUpdateRef.current = null;
          rafIdRef.current = null;
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      // Process entries and find the most relevant intersecting section
      // Prioritize entries that are intersecting
      const intersectingEntries = entries.filter(entry => entry.isIntersecting);
      
      if (intersectingEntries.length > 0) {
        // If multiple sections are intersecting, use the one with the highest intersection ratio
        const mostVisible = intersectingEntries.reduce((prev, current) => {
          return (current.intersectionRatio > prev.intersectionRatio) ? current : prev;
        });
        
        updateActiveSection(mostVisible.target.id);
      }
    }, observerOptions);

    // Defer observer setup to prevent forced reflow during initial render
    // Use requestAnimationFrame to batch DOM reads
    const setupRafId = requestAnimationFrame(() => {
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    });

    return () => {
      cancelAnimationFrame(setupRafId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pendingUpdateRef.current = null;
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