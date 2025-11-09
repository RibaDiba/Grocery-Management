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
        background: 'linear-gradient(to bottom, #CBDFC9 0%, #95C590 100%)'
      }}
    >
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img src="/PantryPilotLogo.png" alt="" />
        </div>

        {/* Heading */}
        <h1 
          className="mb-4 text-5xl font-bold sm:text-6xl"
          style={{ color: '#354A33' }}
        >
          SaveRe
        </h1>

        {/* Shortened Message */}
        <p 
          className="mb-12 text-lg leading-relaxed sm:text-xl"
          style={{ color: '#354A33' }}
        >
          SaveRe it. Don't waste it.
        </p>
        
        {/* Buttons with Different Colors */}
        <div className="flex flex-col gap-4 mx-5">
          <button
            onClick={onSignInClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: '#354A33',
              color: '#FFFFFF',
              borderRadius: '9999px',
              boxShadow: '0px 4px 12px rgba(53, 74, 51, 0.3)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={onSignUpClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#354A33',
              borderRadius: '9999px',
              border: '2px solid #354A33',
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
