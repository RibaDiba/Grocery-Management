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

      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        return 'mobile';
      } else {
        return 'desktop';
      }
    };

    setView(determineView());

    const handleResize = () => {
      setView(determineView());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (view === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <main>
      {view === 'pwa' && <PwaView />}
      {view === 'desktop' && <DesktopView />}
      {view === 'mobile' && <MobileView />}
    </main>
  );
}