"use client";

import { useState, useEffect } from 'react';
import DesktopView from './components/DesktopView';
import MobileView from './components/MobileView';
import PwaView from './components/PwaView';

export default function Home() {
  const [view, setView] = useState<'loading' | 'desktop' | 'mobile' | 'pwa'>('loading');

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    if (isPWA) {
      setView('pwa');
      return;
    }

    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
      setView('mobile');
    } else {
      setView('desktop');
    }
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