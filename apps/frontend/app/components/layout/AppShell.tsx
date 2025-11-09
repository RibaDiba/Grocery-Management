"use client";

import React from 'react';
import BottomNav from './BottomNav';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';
import SuccessPopup from '../common/SuccessPopup';

export default function AppShell({ children }: { children: React.ReactNode }) {
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

      <BottomNav
        fileInputRef={fileInputRef}
        uploading={uploading}
        onSelectFile={handleFileSelect}
        onFileChange={handleFileChange}
      />
    </div>
  );
}