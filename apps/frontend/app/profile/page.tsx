"use client";

import { useRouter } from 'next/navigation';
import ProfilePage from '../components/ProfilePage';

export default function Profile() {
  const router = useRouter();

  const handleSignOut = () => {
    // Get user ID before clearing to preserve profile image
    const currentUserId = localStorage.getItem('user_id');
    
    // Clear authentication and session data, but keep user-specific data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    // Note: profile_image is stored with user-specific key (profile_image_${userId}), so it persists
    localStorage.removeItem('user_name');
    localStorage.removeItem('food_logs');
    
    // Clear sessionStorage
    sessionStorage.removeItem('password_reset_code');
    sessionStorage.removeItem('password_reset_email');
    sessionStorage.removeItem('password_reset_timestamp');
    
    // Redirect to home page which will show sign-in/sign-up
    router.push('/');
    // Force a hard redirect to ensure state is cleared
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return <ProfilePage onSignOut={handleSignOut} />;
}

