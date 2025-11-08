"use client";

import { useState, useEffect } from 'react';
import DesktopView from './components/DesktopView';
import MobileView from './components/MobileView';
import PwaView from './components/PwaView';

export default function Home() {
  const [view, setView] = useState<'loading' | 'desktop' | 'mobile' | 'pwa'>('loading');

  useEffect(() => {
    const determineView = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      if (isPWA) {
        return 'pwa';
      }

      // Use screen size instead of device detection
      // Mobile view for screens smaller than 768px (typical tablet/mobile breakpoint)
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        return 'mobile';
      } else {
        return 'desktop';
      }
    };

    // Set initial view
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(determineView());

    // Listen for window resize to update view dynamically
    const handleResize = () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView(determineView());
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (view === 'loading') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (view === 'pwa') {
    return <PwaView />;
  }

  if (view === 'desktop') {
    return <DesktopView />;
  }

  if (view === 'mobile') {
    return <MobileView />;
  }

  return null;
}