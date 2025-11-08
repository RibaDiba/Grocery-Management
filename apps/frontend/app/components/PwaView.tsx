"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ReceiptsList from './ReceiptsList';

interface GroceryItem {
  id: number;
  name: string;
  completed: boolean;
}

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

export default function PwaView() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);

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

  const handleAddItem = () => {
    if (newItem.trim() !== '') {
      setItems([...items, { id: Date.now(), name: newItem, completed: false }]);
      setNewItem('');
    }
  };

  const handleToggleItem = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSignIn = () => {
    setSignedIn(true);
  };

  const handleSignUp = () => {
    setSignedIn(true);
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
      
      if (data.success) {
        const newItems = data.items.map((item: ParsedGroceryItem) => ({
          id: Math.random(),
          name: item.description,
          completed: false,
        }));
        setItems([...items, ...newItems]);
      }

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-800 p-4 text-white">
        {showSignIn ? (
          <SignIn onSignIn={handleSignIn} />
        ) : (
          <SignUp onSignUp={handleSignUp} />
        )}
        <button
          onClick={() => setShowSignIn(!showSignIn)}
          className="mt-4 text-white underline"
        >
          {showSignIn ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center bg-white py-12 px-8 dark:bg-black sm:items-start">
        <header className="w-full">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Grocery List
          </h1>
        </header>

        <div className="mt-8 w-full">
          <div className="flex gap-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add a new item"
              className="flex-grow rounded-full border border-solid border-black/[.08] px-5 py-3 text-black transition-colors focus:border-transparent focus:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:text-white dark:focus:bg-[#1a1a1a]"
            />
            <button
              onClick={handleAddItem}
              className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Add
            </button>
          </div>
        </div>

        <ul className="mt-8 w-full space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900"
              >
                <span
                  className={`text-lg ${
                    item.completed ? 'text-zinc-500 line-through dark:text-zinc-400' : 'text-black dark:text-zinc-50'
                  }`}
                  onClick={() => handleToggleItem(item.id)}
                >
                  {item.name}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <ReceiptsList 
          receipts={receipts}
          loading={loading}
          error={error}
          uploading={uploading}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
        />
      </main>
    </div>
  );
}