"use client";

import { useState, type ChangeEvent, type RefObject } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface BottomNavProps {
  fileInputRef: RefObject<HTMLInputElement>;
  uploading: boolean;
  onSelectFile: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenManualInput: () => void;
}

export default function BottomNav({ fileInputRef, uploading, onSelectFile, onFileChange, onOpenManualInput }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);

  const homeActive = pathname === '/';
  const calendarActive = pathname?.startsWith('/calendar');
  const recipesActive = pathname?.startsWith('/recipes');
  const profileActive = pathname?.startsWith('/profile');
  const color = '#354A33';


  return (
    <>
      {fabOpen && (
        <div 
          className="fixed inset-0 z-[60] transition-opacity duration-300"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={() => setFabOpen(false)}
        />
      )}

      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-12 z-[70] flex flex-col items-center">
        <div className={`flex flex-col items-center transition-all duration-300 ease-in-out ${fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'}`}>
          <button
            onClick={() => {
              onOpenManualInput();
              setFabOpen(false);
            }}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)' }}
            aria-label="Add manually"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color }}>
            Input manually
          </span>
        </div>
        <div className={`flex flex-col items-center transition-all duration-300 ease-in-out ${fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'}`}>
          <button
            onClick={() => { onSelectFile(); setFabOpen(false); }}
            disabled={uploading}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
            style={{ boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)' }}
            aria-label="Upload receipt"
          >
            {uploading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color }}>
            {uploading ? 'Uploading...' : 'Upload receipt'}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
        <div className={`flex flex-col items-center transition-all duration-300 ease-in-out ${fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'}`}>
          <button
            onClick={() => setFabOpen(false)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)' }}
            aria-label="Take picture"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color }}>
            Receipt picture
          </span>
        </div>
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-transform duration-300"
          style={{ boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)', transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-label="Open actions"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <nav 
        className="fixed bottom-4 left-4 right-4 bg-white flex items-center justify-between py-3 px-8 rounded-full z-[60] overflow-hidden"
        style={{ boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)' }}
      >
        <button 
          type="button"
          onClick={() => router.push('/')}
className={`flex flex-col items-center gap-1 rounded-full px-4 py-3 transition-colors ${homeActive ? 'bg-[#E6F2E4]' : 'hover:bg-black/5'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: homeActive ? '#1F2A1C' : color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l9-7 9 7v7a2 2 0 01-2 2h-4a2 2 0 01-2-2V12H9v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-7z" />
          </svg>
          <span className="text-xs" style={{ color: homeActive ? '#1F2A1C' : color }}>Home</span>
        </button>
        <button
          type="button"
          onClick={() => router.push('/calendar')}
className={`flex flex-col items-center gap-1 rounded-full px-4 py-3 transition-colors ${calendarActive ? 'bg-[#E6F2E4]' : 'hover:bg-black/5'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: calendarActive ? '#1F2A1C' : color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs" style={{ color: calendarActive ? '#1F2A1C' : color }}>Calendar</span>
        </button>
        <div aria-hidden className="w-24 pointer-events-none" />
        <button 
className={`flex flex-col items-center gap-1 rounded-full px-4 py-3 transition-colors ${recipesActive ? 'bg-[#E6F2E4]' : 'hover:bg-black/5'}`}
          onClick={() => router.push('/recipes')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: recipesActive ? '#1F2A1C' : color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xs" style={{ color: recipesActive ? '#1F2A1C' : color }}>Recipes</span>
        </button>
        <button 
className={`flex flex-col items-center gap-1 rounded-full px-4 py-3 transition-colors ${profileActive ? 'bg-[#E6F2E4]' : 'hover:bg-black/5'}`}
          onClick={() => router.push('/profile')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: profileActive ? '#1F2A1C' : color }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs" style={{ color: profileActive ? '#1F2A1C' : color }}>Profile</span>
        </button>
      </nav>
    </>
  );
}
