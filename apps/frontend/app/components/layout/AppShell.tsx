"use client";

import React, { useState, useEffect } from 'react';
// Import manual input overlay (alias path fallback for resolution issues)
import ManualGroceriesInput from '@/app/components/manual/ManualGroceriesInput';
import BottomNav from './BottomNav';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';
import SuccessPopup from '../common/SuccessPopup';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  
  useEffect(() => {
    // Listen for storage changes to sync auth state
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      setIsSignedIn(!!token);
    };
    
    // Initial check
  const token = localStorage.getItem('access_token');
  // Defer to next tick to avoid synchronous setState warning inside effect body
  setTimeout(() => setIsSignedIn(!!token), 0);
    
    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Also listen for custom auth events from children
  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsSignedIn(customEvent.detail?.isSignedIn ?? false);
    };
    
    window.addEventListener('authStateChange', handleAuthChange);
    return () => window.removeEventListener('authStateChange', handleAuthChange);
  }, []);
  
  // Poll localStorage periodically as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      setIsSignedIn(!!token);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  

  const {
    fileInputRef,
    uploading,
    uploadSuccess,
    uploadError,
    uploadResult,
    handleFileSelect,
    handleFileChange,
  } = useReceiptUpload();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {showManualInput && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setShowManualInput(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <ManualGroceriesInput onClose={() => setShowManualInput(false)} />
          </div>
        </div>
      )}

      {uploadError && (
        <div
          className="fixed bottom-36 left-4 right-4 bg-red-50 border border-red-300 rounded-xl p-4 z-[60] shadow-lg"
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
          onClose={() => {}}
        />
      )}

      {isSignedIn && (
        <BottomNav
          fileInputRef={fileInputRef}
          uploading={uploading}
          onSelectFile={handleFileSelect}
          onFileChange={handleFileChange}
          onOpenManualInput={() => setShowManualInput(true)}
        />
      )}
    </div>
  );
}