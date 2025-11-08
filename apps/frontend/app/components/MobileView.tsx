"use client";

import { useState, useEffect } from 'react';
import AuthIntro from './AuthIntro';
import AuthForm from './AuthForm';
import IngredientsList from './IngredientsList';
import ReceiptsList from './ReceiptsList';

export default function MobileView() {
  const [signedIn, setSignedIn] = useState(false);
  const [authView, setAuthView] = useState<'intro' | 'signin' | 'signup'>('intro');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Try to get userId from localStorage, or decode from token
      let userId = localStorage.getItem('user_id');
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
          if (userId) {
            localStorage.setItem('user_id', userId);
          }
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }
      
      if (userId) {
        setSignedIn(true);
        setUserToken(token);
        setCurrentUserId(userId);
        // Don't set authView when signed in - user goes directly to app
      } else {
        setAuthView('intro'); // Show intro if no valid user
      }
    } else {
      setAuthView('intro'); // Show intro if no token
    }
  }, []);

  const handleSignIn = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
  };

  const handleSignUp = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
  };

  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center bg-white py-12 px-8 sm:items-start">
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/PantryPiolotLogo.png" 
              alt="PantryPilot Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-green-800">
              PantryPilot
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Sign Out
          </button>
        </header>

        <IngredientsList userId={currentUserId} />
        <ReceiptsList userId={currentUserId} />
      </main>
    </div>
  );
}
