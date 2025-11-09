"use client";

interface BottomNavProps {
  onCalendarClick: () => void;
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  color?: string;
}

export default function BottomNav({ 
  onCalendarClick, 
  onHomeClick, 
  onProfileClick,
  color = '#354A33' 
}: BottomNavProps) {
  return (
    <nav 
      className="fixed bottom-4 left-4 right-4 bg-white flex items-center justify-between py-3 px-8 rounded-full z-20"
      style={{
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)'
      }}
    >
      <button type="button" onClick={onCalendarClick} className="flex flex-col items-center gap-1">
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs" style={{ color }}>Calendar</span>
      </button>
      <button onClick={onProfileClick} className="flex flex-col items-center gap-1">
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs" style={{ color }}>Profile</span>
      </button>
    </nav>
  );
}
