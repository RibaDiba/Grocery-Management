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
        background: 'linear-gradient(to bottom, #CBDFC9 32%, #95C590 100%)'
      }}
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <img 
            src="/PantryPiolotLogo.png" 
            alt="PantryPilot Logo" 
            className="h-24 w-auto sm:h-32"
            style={{ filter: 'none' }}
          />
        </div>
        <h1 className="mb-4 text-4xl font-bold" style={{ color: '#354A33' }}>
          Hello
        </h1>
        <p className="mb-12 text-xl" style={{ color: '#4A614F' }}>
          Welcome to PantryPilot. Manage your grocery list and track receipts with ease.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onSignInClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-colors hover:bg-gray-50 sm:w-auto"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#354A33',
              borderRadius: '9999px'
            }}
          >
            Sign In
          </button>
          <button
            onClick={onSignUpClick}
            className="w-full rounded-full px-8 py-4 text-lg font-semibold transition-colors hover:bg-gray-50 sm:w-auto"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#354A33',
              borderRadius: '9999px'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

