"use client";

import { useState, useEffect, useRef } from 'react';
import AuthIntro from './AuthIntro';
import AuthForm from './AuthForm';
import IngredientsList from './IngredientsList';
import ReceiptsList from './ReceiptsList';

interface Receipt {
  user_id: string;
  file_path: string;
  raw_text: string;
  grocery_items: string[];
}

interface ParsedGroceryItem {
  description: string;
  quantity: number;
  price: number;
}

interface UploadResponse {
  success: boolean;
  items: ParsedGroceryItem[];
  total_items: number;
  raw_text: string;
  processing_time_ms: number;
}

export default function MobileView() {
  const [signedIn, setSignedIn] = useState(false);
  const [authView, setAuthView] = useState<'intro' | 'signin' | 'signup'>('intro');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('No access token found. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/receipts/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch receipts');
        }

        const data = await response.json();
        
        setReceipts(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
        console.error('Error fetching receipts:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (signedIn) {
      fetchReceipts();
    }
  }, [signedIn]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Try to get userId from localStorage, or decode from token
      let userId = localStorage.getItem('user_id');
      if (!userId) {
        // Decode JWT to get user_id if not stored
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          userId = payload.sub || null;
          if (userId) {
            localStorage.setItem('user_id', userId);
          }
        } catch (error) {
          console.error('Error decoding JWT:', error);
        }
      }
      
      if (userId) {
        setSignedIn(true);
        setUserToken(token);
        setCurrentUserId(userId);
        // Don't set authView when signed in - user goes directly to app
      } else {
        setAuthView('intro'); // Show intro if no valid user
      }
    } else {
      setAuthView('intro'); // Show intro if no token
    }
  }, []);

  const handleSignIn = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
  };

  const handleSignUp = (accessToken: string, userId: string) => {
    setSignedIn(true);
    setUserToken(accessToken);
    setCurrentUserId(userId);
  };

  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    
    // Reset state
    setSignedIn(false);
    setAuthView('intro');
    setUserToken(null);
    setCurrentUserId(null);
  };

  const handleSignInClick = () => {
    setAuthView('signin');
  };

  const handleSignUpClick = () => {
    setAuthView('signup');
  };

  const handleBackToIntro = () => {
    setAuthView('intro');
  };

  const handleSwitchMode = () => {
    setAuthView(authView === 'signin' ? 'signup' : 'signin');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUploadError('No access token found. Please sign in again.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/receipt/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload receipt');
      }

      const data: UploadResponse = await response.json();
      
      // Log the API response to console
      console.log('Receipt upload successful:', data);
      console.log('Upload response details:', {
        success: data.success,
        total_items: data.total_items,
        items: data.items,
        raw_text: data.raw_text,
        processing_time_ms: data.processing_time_ms,
      });
      
      // Log each extracted item
      if (data.items && data.items.length > 0) {
        console.log('Extracted grocery items:');
        data.items.forEach((item, index) => {
          console.log(`  Item ${index + 1}:`, item);
        });
      }

      // Refresh the receipts list
      const receiptsResponse = await fetch('http://localhost:8000/api/receipts/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        setReceipts(receiptsData);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error uploading receipt:', err);
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (!signedIn) {
    if (authView === 'intro') {
      return <AuthIntro onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />;
    }
    
    return (
      <AuthForm
        mode={authView === 'signin' ? 'signin' : 'signup'}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onBack={handleBackToIntro}
        onSwitchMode={handleSwitchMode}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center bg-white py-12 px-8 sm:items-start">
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/PantryPiolotLogo.png" 
              alt="PantryPilot Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-3xl font-semibold leading-10 tracking-tight text-green-800">
              PantryPilot
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          >
            Sign Out
          </button>
        </header>

        <ReceiptsList 
          receipts={receipts}
          loading={loading}
          error={error}
          uploading={uploading}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
        />
        <IngredientsList userId={currentUserId} />
      </main>
    </div>
  );
}
