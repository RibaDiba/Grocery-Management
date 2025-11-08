"use client";

import React from 'react';

interface AuthIntroProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export default function AuthIntro({ onSignInClick, onSignUpClick }: AuthIntroProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-800 p-4 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <img 
            src="/PantryPiolotLogo.png" 
            alt="PantryPilot Logo" 
            className="h-24 w-auto sm:h-32"
          />
        </div>
        <p className="mb-12 text-xl text-white/90">
          Manage your grocery list and track receipts with ease
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onSignInClick}
            className="w-full rounded-full bg-white px-8 py-4 text-lg font-semibold text-green-700 transition-colors hover:bg-gray-100 sm:w-auto"
          >
            Sign In
          </button>
          <button
            onClick={onSignUpClick}
            className="w-full rounded-full border-2 border-white bg-transparent px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

