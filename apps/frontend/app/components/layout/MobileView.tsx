"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AuthIntro from '../auth/AuthIntro';
import AuthForm from '../auth/AuthForm';
import IngredientsList from '../ingredients/IngredientsList';
import RecipesList from '../recipes/RecipesList';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';
import { IngredientSkeleton } from '../common/SkeletonLoader';
import SuccessPopup from '../common/SuccessPopup';
import CalendarOverlay, { type WeekSelection } from '../calendar/CalendarOverlay';
import BottomNav from './BottomNav';

export default function MobileView() {
  const router = useRouter();
  const pathname = usePathname();
  const homeActive = pathname === '/';
  const calendarActive = pathname?.startsWith('/calendar');
  const recipesActive = pathname?.startsWith('/recipes');
  const profileActive = pathname?.startsWith('/profile');
  const [signedIn, setSignedIn] = useState(false);
  const [authView, setAuthView] = useState<'intro' | 'signin' | 'signup'>('intro');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const { fileInputRef, uploading, uploadSuccess, uploadError, uploadResult, handleFileSelect, handleFileChange } = useReceiptUpload();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeekRange, setSelectedWeekRange] = useState<WeekSelection | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Try to get userId from localStorage, or decode from token
      let userId = localStorage.getItem('user_id');
      let username = localStorage.getItem('username');
      if (!userId) {
        // Decode JWT to get user_id if not stored
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
          userId = payload.sub || null;
          username = payload.username || username;
          if (userId) localStorage.setItem('user_id', userId);
          if (username) localStorage.setItem('username', username);
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }
      
      if (userId) {
        // Defer grouped state updates
        setTimeout(() => {
          setSignedIn(true);
          setUserToken(token);
          setCurrentUserId(userId);
          setCurrentUsername(username || null);
        }, 0);
      } else {
        setTimeout(() => setAuthView('intro'), 0);
      }
    } else {
      setTimeout(() => setAuthView('intro'), 0);
    }
  }, []);

  const handleSignIn = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setCurrentUsername(storedUsername);
  };

  const handleSignUp = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) setCurrentUsername(storedUsername);
  };

  // Potential future use: expose sign out action in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('username');
    
    // Reset state
    setSignedIn(false);
    setAuthView('intro');
    setUserToken(null);
    setCurrentUserId(null);
  };

  const handleSignInClick = () => {
    setAuthView('signin');
  };

  const handleSignUpClick = () => {
    setAuthView('signup');
  };

  const handleBackToIntro = () => {
    setAuthView('intro');
  };

  const handleSwitchMode = () => {
    setAuthView(authView === 'signin' ? 'signup' : 'signin');
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
            PantryPilot
          </h1>
        </div>
      </header>

      {/* Hello User Text */}
      <div className="px-4 pb-2">
        <p className="text-lg font-medium" style={{ color: '#354A33' }}>
          Hello {currentUsername || 'User'},
        </p>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-20">
        <IngredientsList userId={currentUserId} selectedWeekRange={selectedWeekRange} />
        <RecipesList />
      </main>


      {/* Error Messages */}
      {uploadError && (
        <div 
          className="fixed bottom-24 left-4 right-4 bg-red-50 border border-red-300 rounded-xl p-4 z-20 shadow-lg"
          style={{ color: '#c53030' }}
        >
          <div className="flex items-start gap-3">
            <svg 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <p className="font-medium text-sm">{uploadError}</p>
            </div>
          </div>
        </div>
      )}
      
      {uploadSuccess && uploadResult && (
        <SuccessPopup 
          message="Receipt uploaded successfully!"
          subMessage={`${uploadResult.total_items} item${uploadResult.total_items !== 1 ? 's' : ''} extracted`}
          onClose={() => {/* popup auto-dismiss handled externally; noop */}}
        />
      )}

      <CalendarOverlay
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        token={userToken}
        onWeekSelect={setSelectedWeekRange}
      />

      <BottomNav 
        fileInputRef={fileInputRef}
        uploading={uploading}
        onSelectFile={handleFileSelect}
        onFileChange={handleFileChange}
      />
    </div>
  );
}
