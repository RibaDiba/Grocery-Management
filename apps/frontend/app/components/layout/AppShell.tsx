"use client";

import React, { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';
import SuccessPopup from '../common/SuccessPopup';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  useEffect(() => {
    // Listen for storage changes to sync auth state
    const handleStorageChange = () => {
      const token = localStorage.getItem('access_token');
      setIsSignedIn(!!token);
    };
    
    // Initial check
    const token = localStorage.getItem('access_token');
    setIsSignedIn(!!token);
    
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
    <div className="min-h-screen">
      {children}

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
        />
      )}
    </div>
  );
}