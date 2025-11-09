"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthIntro from '../auth/AuthIntro';
import AuthForm from '../auth/AuthForm';
import IngredientsList from '../ingredients/IngredientsList';
import RecipesList from '../recipes/RecipesList';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';
import { IngredientSkeleton } from '../common/SkeletonLoader';
import SuccessPopup from '../common/SuccessPopup';
import CalendarOverlay, { type WeekSelection } from '../calendar/CalendarOverlay';

export default function PwaView() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [authView, setAuthView] = useState<'intro' | 'signin' | 'signup'>('intro');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const { fileInputRef, uploading, uploadSuccess, uploadError, uploadResult, handleFileSelect, handleFileChange, resetUpload } = useReceiptUpload();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedWeekRange, setSelectedWeekRange] = useState<WeekSelection | null>(null);

  useEffect(() => {
    if (!signedIn && authView !== 'intro') {
      setAuthView('intro');
    }
  }, [signedIn, authView]);

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
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    setSignedIn(false);
    setAuthView('intro');
    setUserToken(null);
    setCurrentUserId(null);
  };

  const handleSignInClick = () => setAuthView('signin');
  const handleSignUpClick = () => setAuthView('signup');
  const handleBackToIntro = () => setAuthView('intro');
  const handleSwitchMode = () => setAuthView(authView === 'signin' ? 'signup' : 'signin');

  const calendarActive = showCalendar;

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
          Hello {currentUserId ? `User` : 'User'},
        </p>
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-20">
        <IngredientsList userId={currentUserId} selectedWeekRange={selectedWeekRange} />
        <RecipesList />
      </main>

      {/* Backdrop Blur Overlay */}
      {fabOpen && (
        <div 
          className="fixed inset-0 z-25 transition-opacity duration-300"
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-12 z-30 flex flex-col items-center">
        {/* Document/Pencil Icon Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => setFabOpen(false)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#354A33' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: '#354A33' }}>
            Input manually
          </span>
        </div>
        {/* Upload Receipt Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => {
              handleFileSelect();
              setFabOpen(false);
            }}
            disabled={uploading}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            {uploading ? (
              <svg 
                className="w-6 h-6 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#354A33' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#354A33' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: '#354A33' }}>
            {uploading ? 'Uploading...' : 'Upload receipt'}
          </span>
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {/* Camera Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => setFabOpen(false)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#354A33' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: '#354A33' }}>
            Receipt picture
          </span>
        </div>
        {/* Main Plus Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-transform duration-300"
          style={{
            boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)',
            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

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
          onClose={() => setShowSuccessPopup(false)}
        />
      )}

      <CalendarOverlay
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        token={userToken}
        onWeekSelect={setSelectedWeekRange}
      />

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-4 left-4 right-4 bg-white flex items-center justify-between py-3 px-8 rounded-full z-20"
        style={{
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            router.push('/calendar');
            setFabOpen(false);
          }}
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
      
      <BottomNav 
        onCalendarClick={() => router.push('/calendar')}
        onProfileClick={() => {}}
      />
    </div>
  );
}