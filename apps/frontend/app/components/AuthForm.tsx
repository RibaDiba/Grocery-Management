"use client";

import React from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSignIn: (accessToken: string, userId: string) => void;
  onSignUp: (accessToken: string, userId: string) => void;
  onBack: () => void;
  onSwitchMode: () => void;
}

export default function AuthForm({ 
  mode, 
  onSignIn, 
  onSignUp, 
  onBack, 
  onSwitchMode 
}: AuthFormProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-800 p-4 text-white">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
      >
        ← Back
      </button>
      
      <div className="w-full max-w-xs">
        <div className="mb-6 flex justify-center">
          <img 
            src="/PantryPiolotLogo.png" 
            alt="PantryPilot Logo" 
            className="h-16 w-auto"
          />
        </div>
        {mode === 'signin' ? (
          <SignIn onSignIn={onSignIn} />
        ) : (
          <SignUp onSignUp={onSignUp} />
        )}
        
        <button
          onClick={onSwitchMode}
          className="mt-4 w-full text-center text-white underline"
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}

