"use client";

import React from 'react';

interface AuthIntroProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export default function AuthIntro({ onSignInClick, onSignUpClick }: AuthIntroProps) {
  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to bottom, #E8F5E9 0%, #CBDFC9 50%, #95C590 100%)'
      }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white/80 shadow-inner flex items-center justify-center">
            <span className="text-3xl font-semibold tracking-wide" style={{ color: '#2D5016' }}>
              PP
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 
          className="mb-4 text-5xl font-bold sm:text-6xl"
          style={{ color: '#2D5016' }}
        >
          Hello
        </h1>

        {/* Shortened Message */}
        <p 
          className="mb-12 text-lg leading-relaxed sm:text-xl"
          style={{ color: '#4A614F' }}
        >
          Prevent food waste by tracking your groceries and getting notified when items are about to expire.
        </p>
        
        {/* Buttons with Different Colors */}
        <div className="flex flex-col gap-4">
          <button
            onClick={onSignInClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: '#2D5016',
              color: '#FFFFFF',
              borderRadius: '9999px',
              boxShadow: '0px 4px 12px rgba(45, 80, 22, 0.3)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={onSignUpClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#2D5016',
              borderRadius: '9999px',
              border: '2px solid #2D5016',
              boxShadow: '0px 4px 12px rgba(255, 255, 255, 0.3)'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
