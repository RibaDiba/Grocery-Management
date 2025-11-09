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
    <div 
      className="relative flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(to bottom, #CBDFC9 0%, #95C590 100%)'
      }}
    >
      <button
        onClick={onBack}
        className="absolute left-4 top-4 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: '#354A33'
        }}
      >
        ← Back
      </button>
      
      <div className="w-full max-w-xs">
        <div className="mb-6 flex justify-center">
          <img 
            src="/PantryPilotLogo.png" 
            alt="PantryPilot Logo" 
            className="h-16 w-auto"
            style={{ filter: 'none' }}
          />
        </div>
        {mode === 'signin' ? (
          <SignIn onSignIn={onSignIn} />
        ) : (
          <SignUp onSignUp={onSignUp} />
        )}
        
        <button
          onClick={onSwitchMode}
          className="mt-4 w-full text-center underline transition-colors hover:opacity-80"
          style={{ color: '#354A33' }}
        >
          {mode === 'signin' 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}

