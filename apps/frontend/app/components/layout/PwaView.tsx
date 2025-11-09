"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthIntro from '../auth/AuthIntro';
import AuthForm from '../auth/AuthForm';
import IngredientsList from '../ingredients/IngredientsList';
import ExpiringSoonList from '../ingredients/ExpiringSoonList';
import RecipesList from '../recipes/RecipesList';
import CalendarOverlay, { type WeekSelection } from '../calendar/CalendarOverlay';

export default function PwaView() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [authView, setAuthView] = useState<'intro' | 'signin' | 'signup'>('intro');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeekRange, setSelectedWeekRange] = useState<WeekSelection | null>(null);

  useEffect(() => {
    if (!signedIn && authView !== 'intro') {
      setTimeout(() => setAuthView('intro'), 0);
    }
  }, [signedIn, authView]);

  // Initialize auth state from localStorage/JWT and populate username
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    // Always attempt to fetch profile to ensure username availability
    fetch('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(profile => {
        localStorage.setItem('user_id', profile.id);
        localStorage.setItem('username', profile.username || '');
        setSignedIn(true);
        setUserToken(token);
        setCurrentUserId(profile.id);
        setCurrentUsername(profile.username || null);
      })
      .catch(() => {
        // Fallback: decode JWT minimally
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          const userId = payload.sub || null;
          const username = payload.username || null;
          if (userId) localStorage.setItem('user_id', userId);
          if (username) localStorage.setItem('username', username);
          if (userId) {
            setSignedIn(true);
            setUserToken(token);
            setCurrentUserId(userId);
            setCurrentUsername(username);
          }
        } catch { /* ignore */ }
      });
  }, []);

  const handleSignIn = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
    // Fetch profile to get authoritative username
    fetch('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => {
        localStorage.setItem('username', p.username || '');
        setCurrentUsername(p.username || null);
      })
      .catch(() => {
        const storedUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
        if (storedUsername) setCurrentUsername(storedUsername);
      });
    window.dispatchEvent(new CustomEvent('authStateChange', { detail: { isSignedIn: true } }));
  };

  const handleSignUp = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
    fetch('http://localhost:8000/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => {
        localStorage.setItem('username', p.username || '');
        setCurrentUsername(p.username || null);
      })
      .catch(() => {
        const storedUsername = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
        if (storedUsername) setCurrentUsername(storedUsername);
      });
    window.dispatchEvent(new CustomEvent('authStateChange', { detail: { isSignedIn: true } }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    setSignedIn(false);
    setAuthView('intro');
    setUserToken(null);
    setCurrentUserId(null);
    setCurrentUsername(null);
  };

  const handleSignInClick = () => setAuthView('signin');
  const handleSignUpClick = () => setAuthView('signup');
  const handleBackToIntro = () => setAuthView('intro');
  const handleSwitchMode = () => setAuthView(authView === 'signin' ? 'signup' : 'signin');

  const calendarActive = showCalendar;
  const addReceiptLabel = uploading ? 'Uploading...' : 'Add Receipt';

  const handleAddReceiptFromOverlay = () => {
    if (uploading) return;
    handleFileSelect();
    setShowCalendar(false);
    setFabOpen(false);
  };

  const handleViewProfile = () => {
    router.push('/profile');
    setShowCalendar(false);
    setFabOpen(false);
  };

  if (!signedIn) {
    if (authView === 'intro') {
      return <AuthIntro onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />;
    }
    return (
      <AuthForm
        mode={authView === 'signin' ? 'signin' : 'signup'}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onBack={handleBackToIntro}
        onSwitchMode={handleSwitchMode}
      />
    );
  }

  return (
    <div 
      className="flex min-h-screen flex-col font-sans"
      style={{
        background: 'linear-gradient(to bottom, #CBDFC9 32%, #95C590 100%)'
      }}
    >
      {/* Main Navigation Bar */}
      <header className="w-full flex items-center justify-between px-4 py-4 bg-transparent">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/PantryPilotLogo.png" 
            alt="PantryPilot Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-3xl font-semibold leading-10 tracking-tight" style={{ color: '#354A33' }}>
            SaveRe
          </h1>
        </div>
      </header>

      {/* Hello User Text */}
      <div className="px-4 pb-2">
        <p className="text-3xl font-medium" style={{ color: '#354A33' }}>
          Hello {currentUsername || currentUserId || 'User'},
        </p>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-28">
        <IngredientsList userId={currentUserId} selectedWeekRange={selectedWeekRange} />
        <ExpiringSoonList userId={currentUserId} />
        <RecipesList />
      </main>

      <CalendarOverlay
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        token={userToken}
        onWeekSelect={setSelectedWeekRange}
        onAddReceipt={handleAddReceiptFromOverlay}
        addReceiptLabel={addReceiptLabel}
        addReceiptDisabled={uploading}
        onViewProfile={handleViewProfile}
      />

      <nav 
        className="fixed bottom-4 left-4 right-4 bg-white flex items-center justify-between py-3 px-8 rounded-full z-20"
        style={{
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)'
        }}
      >
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          aria-pressed={calendarActive}
          className={`flex flex-col items-center gap-1 rounded-full px-4 py-2 transition-colors ${
            calendarActive ? 'bg-[#E6F2E4]' : 'hover:bg-black/5'
          }`}
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: calendarActive ? '#1F2A1C' : '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-medium" style={{ color: calendarActive ? '#1F2A1C' : '#354A33' }}>
            Calendar
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (uploading) return;
            handleFileSelect();
            setFabOpen(false);
          }}
          disabled={uploading}
          className="flex flex-col items-center gap-1 rounded-full px-4 py-2 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs font-medium" style={{ color: '#354A33' }}>
            {addReceiptLabel}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="flex flex-col items-center gap-1 rounded-full px-4 py-2 transition-colors hover:bg-black/5"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium" style={{ color: '#354A33' }}>
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
}
