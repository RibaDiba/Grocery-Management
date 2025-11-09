"use client";

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload } from 'lucide-react';
import { useReceiptUpload } from '../../hooks/useReceiptUpload';

const COLORS = {
  primary: '#354A33',
};

export default function EmptyIngredientsCard() {
  const router = useRouter();
  const {
    fileInputRef,
    uploading,
    uploadError,
    handleFileSelect,
    handleFileChange,
  } = useReceiptUpload();

  // Separate input for direct camera capture on mobile
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const triggerCamera = () => {
    // Clear any previous value to ensure change event fires
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  return (
    <div 
      className="rounded-lg p-3"
      style={{
        backgroundColor: '#E8F5E9',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Section Header - Clickable */}
      <button 
        onClick={() => router.push('/ingredients')}
        className="flex items-center justify-between mb-2 bg-transparent w-full hover:opacity-80 transition-opacity duration-200"
      >
        <div className="flex items-center gap-2">
          {/* Warning Icon (kept for visual consistency) */}
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: COLORS.primary }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-lg font-semibold" style={{ color: COLORS.primary }}>
            Groceries
          </h2>
        </div>
        {/* Arrow Icon */}
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: COLORS.primary }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Empty state actions */}
      <div className="p-3 rounded-md border border-dashed bg-white/70" style={{ borderColor: '#CBDFC9' }}>
        <p className="text-sm mb-3" style={{ color: COLORS.primary }}>
          No groceries found. Add some by uploading a receipt or taking a photo.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleFileSelect}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading…' : 'Upload Receipt'}</span>
          </button>
          <button
            onClick={triggerCamera}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border transition-all duration-200 hover:bg-white disabled:opacity-50"
            style={{ borderColor: COLORS.primary, color: COLORS.primary, backgroundColor: '#F8FFFA' }}
          >
            <Camera className="w-4 h-4" />
            <span>Take Picture</span>
          </button>
        </div>
        {uploadError && (
          <p className="mt-2 text-xs text-red-600">{uploadError}</p>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          hidden
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          hidden
        />
      </div>
    </div>
  );
}
