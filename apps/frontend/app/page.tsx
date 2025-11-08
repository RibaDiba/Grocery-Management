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

      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

      if (isMobile) {
        return 'mobile';
      } else {
        return 'desktop';
      }
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(determineView());
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