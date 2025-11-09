"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChangePasswordModal from './ChangePasswordModal';

interface ProfilePageProps {
  onBack?: () => void;
  onSignOut?: () => void;
}

// Helper function to decode JWT token
const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export default function ProfilePage({ onBack, onSignOut }: ProfilePageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userEmail, setUserEmail] = useState<string>('placeholder@email.com');
  const [userName, setUserName] = useState<string>('User Name');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        // Fetch user profile from API to get the actual username from signup
        const response = await fetch('http://localhost:8000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const profile = await response.json();
          setUserId(profile.id);
          setUserEmail(profile.email);
          setUserName(profile.username || 'User');
          
          // Store in localStorage for consistency
          localStorage.setItem('user_id', profile.id);
          localStorage.setItem('user_email', profile.email);
          localStorage.setItem('username', profile.username || 'User');
        } else {
          // Fallback to localStorage/JWT if API fails
          const storedUserId = localStorage.getItem('user_id');
          const storedEmail = localStorage.getItem('user_email');
          const storedUsername = localStorage.getItem('username');
          
          if (storedUserId) setUserId(storedUserId);
          if (storedEmail) setUserEmail(storedEmail);
          if (storedUsername) {
            setUserName(storedUsername);
          } else {
            // Try to get from JWT token
            const payload = decodeJWT(token);
            if (payload) {
              if (payload.sub) setUserId(payload.sub);
              if (payload.email) setUserEmail(payload.email);
              if (payload.username) setUserName(payload.username);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage/JWT
        const storedUserId = localStorage.getItem('user_id');
        const storedEmail = localStorage.getItem('user_email');
        const storedUsername = localStorage.getItem('username');
        
        if (storedUserId) setUserId(storedUserId);
        if (storedEmail) setUserEmail(storedEmail);
        if (storedUsername) {
          setUserName(storedUsername);
        } else {
          const token = localStorage.getItem('access_token');
          if (token) {
            const payload = decodeJWT(token);
            if (payload) {
              if (payload.sub) setUserId(payload.sub);
              if (payload.email) setUserEmail(payload.email);
              if (payload.username) setUserName(payload.username);
            }
          }
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Load profile image using email as key (persists across logins)
  useEffect(() => {
    if (userEmail && userEmail !== 'placeholder@email.com') {
      // Try email-based key first (new approach)
      let savedImage = localStorage.getItem(`profile_image_${userEmail}`);
      
      // Migration: If not found, check userId-based key and migrate
      if (!savedImage && userId) {
        const oldImage = localStorage.getItem(`profile_image_${userId}`);
        if (oldImage) {
          savedImage = oldImage;
          // Migrate to email-based key
          localStorage.setItem(`profile_image_${userEmail}`, oldImage);
          // Optionally remove old key
          localStorage.removeItem(`profile_image_${userId}`);
        }
      }
      
      // Fallback to old global key
      if (!savedImage) {
        const oldGlobalImage = localStorage.getItem('profile_image');
        if (oldGlobalImage) {
          savedImage = oldGlobalImage;
          // Migrate to email-based key
          localStorage.setItem(`profile_image_${userEmail}`, oldGlobalImage);
          localStorage.removeItem('profile_image');
        }
      }
      
      if (savedImage) {
        setProfileImage(savedImage);
      }
    }
  }, [userEmail, userId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleProfileImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
        // Save to localStorage using email as key (persists across logins)
        const currentEmail = userEmail || localStorage.getItem('user_email');
        if (currentEmail && currentEmail !== 'placeholder@email.com') {
          localStorage.setItem(`profile_image_${currentEmail}`, result);
        } else {
          // Fallback to old key if no email
          localStorage.setItem('profile_image', result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      // Get user ID before clearing to preserve profile image
      const currentUserId = userId || localStorage.getItem('user_id');
      
      // Clear authentication and session data, but keep user-specific data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      // Note: profile_image and user_name are stored with user-specific keys (profile_image_${userId}, user_name_${userId}), so they persist
      localStorage.removeItem('food_logs');
      
      // Clear sessionStorage as well
      sessionStorage.removeItem('password_reset_code');
      sessionStorage.removeItem('password_reset_email');
      sessionStorage.removeItem('password_reset_timestamp');
      
      if (onSignOut) {
        onSignOut();
      } else {
        // Redirect to home page which will show sign-in/sign-up
        router.push('/');
        // Force a hard reload to ensure state is cleared
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
  };


  return (
    <div 
      className="min-h-screen flex flex-col pb-20"
      style={{ backgroundColor: '#E8F5E9' }}
    >
      {/* Header Section */}
      <div className="pt-16 pb-5 px-5">
        <button 
          onClick={handleBack}
          className="mb-5 p-2 -ml-2"
          aria-label="Go back"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          {/* Profile Icon - Clickable */}
          <button
            onClick={handleProfileImageClick}
            className="relative mb-4"
            aria-label="Change profile picture"
          >
            <div 
              className="w-24 h-24 rounded-full border-2 border-black flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: '#fff' }}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg 
                  className="w-12 h-12" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#000' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            {/* Camera icon overlay */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#2D5016' }}
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#fff' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          
          {/* User Name (read-only, from signup) */}
          <div className="flex items-center gap-2 mb-2">
            <h1 
              className="text-2xl font-bold"
              style={{ color: '#2D5016' }}
            >
              {userName}
            </h1>
          </div>
          
          {/* Email */}
          <p className="text-sm" style={{ color: '#000' }}>
            {userEmail}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div 
        className="h-px mx-5 my-5"
        style={{ backgroundColor: '#D3D3D3' }}
      />

      {/* Tips & Information Section */}
      <div 
        className="mx-5 mb-5 rounded-xl p-4"
        style={{ 
          backgroundColor: '#fff',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#2D5016' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 
            className="text-lg font-bold"
            style={{ color: '#2D5016' }}
          >
            Tips & Information
          </h2>
        </div>
        
        {/* Tips for meal planning */}
        <button 
          className="w-full flex items-center gap-3 py-3"
          onClick={() => router.push('/tips/meal-planning')}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="flex-1 text-left text-base" style={{ color: '#000' }}>
            Tips for meal planning
          </span>
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#D3D3D3' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Divider */}
        <div 
          className="h-px my-1"
          style={{ backgroundColor: '#D3D3D3' }}
        />
        
        {/* More info on food waste */}
        <button 
          className="w-full flex items-center gap-3 py-3"
          onClick={() => router.push('/tips/food-waste')}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1 text-left text-base" style={{ color: '#000' }}>
            More info on food waste
          </span>
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#D3D3D3' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Setting Section */}
      <div 
        className="mx-5 mb-5 rounded-xl p-4"
        style={{ 
          backgroundColor: '#fff',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#2D5016' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 
            className="text-lg font-bold"
            style={{ color: '#2D5016' }}
          >
            Setting
          </h2>
        </div>
        
        {/* Food log history */}
        <button 
          className="w-full flex items-center gap-3 py-3"
          onClick={() => router.push('/food-log-history')}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="flex-1 text-left text-base" style={{ color: '#000' }}>
            Food log history
          </span>
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#D3D3D3' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Divider */}
        <div 
          className="h-px my-1"
          style={{ backgroundColor: '#D3D3D3' }}
        />
        
        {/* Change Password */}
        <button 
          className="w-full flex items-center gap-3 py-3"
          onClick={() => setShowChangePasswordModal(true)}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="flex-1 text-left text-base" style={{ color: '#000' }}>
            Change Password
          </span>
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#D3D3D3' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Divider */}
        <div 
          className="h-px my-1"
          style={{ backgroundColor: '#D3D3D3' }}
        />
        
        {/* Logout */}
        <button 
          className="w-full flex items-center gap-3 py-3"
          onClick={handleSignOut}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="flex-1 text-left text-base" style={{ color: '#000' }}>
            Logout
          </span>
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#D3D3D3' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Modals */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          userEmail={userEmail}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
}
