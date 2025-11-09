"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IngredientSkeleton } from '../common/SkeletonLoader';

interface GroceryItem {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
}

interface ExpiringSoonListProps {
  userId: string | null;
  onUploadClick?: () => void;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const getExpirationDate = (item: GroceryItem): Date | null => {
  if (item.max_days !== null && item.max_days !== undefined) {
    const createdDate = new Date(item.created_at);
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + item.max_days);
    return expirationDate;
  }

  if (item.min_days !== null && item.min_days !== undefined) {
    const createdDate = new Date(item.created_at);
    const expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + item.min_days);
    return expirationDate;
  }

  return null;
};

const getDaysUntilExpiration = (item: GroceryItem): number | null => {
  const expirationDate = getExpirationDate(item);
  if (!expirationDate) return null;
  
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

interface ExpiringIngredientCardProps {
  ingredient: GroceryItem;
  isFading: boolean;
  onChecked: () => void;
}

const ExpiringIngredientCard = ({ ingredient, isFading, onChecked }: ExpiringIngredientCardProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const now = new Date();
  const createdDate = new Date(ingredient.created_at);
  
  let expirationDate: Date | null = null;
  let daysUntilExpiration: number | null = null;
  
  if (ingredient.max_days !== null) {
    expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + ingredient.max_days);
    daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else if (ingredient.min_days !== null) {
    expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + ingredient.min_days);
    daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const getStatusText = () => {
    if (daysUntilExpiration === null) return null;
    if (daysUntilExpiration < 0) {
      return `Expired ${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) === 1 ? '' : 's'} ago`;
    }
    if (daysUntilExpiration === 0) return 'Expires today';
    if (daysUntilExpiration === 1) return 'Expires tomorrow';
    return `Expires in ${daysUntilExpiration} days`;
  };

  const handleCheck = () => {
    if (!isChecked) {
      setIsChecked(true);
      onChecked();
    }
  };

  return (
    <div 
      className={`rounded-lg p-2 bg-white flex items-center gap-2 transition-opacity duration-300 ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Image Placeholder */}
      <div 
        className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: '#E5E7EB' }}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: '#9CA3AF' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: '#354A33' }}>
          {ingredient.name}
        </p>
        {daysUntilExpiration !== null && (
          <p className="text-xs mt-0.5" style={{ color: '#354A33' }}>
            {getStatusText()}
          </p>
        )}
      </div>
      {/* Checkbox Circle */}
      <button
        onClick={handleCheck}
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          borderColor: isChecked ? '#354A33' : '#354A33',
          backgroundColor: isChecked ? '#354A33' : 'transparent'
        }}
      >
        {isChecked && (
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="white" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default function ExpiringSoonList({ userId, onUploadClick, onFileChange }: ExpiringSoonListProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [ingredients, setIngredients] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [fadingItems, setFadingItems] = useState<Set<string>>(new Set());

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const fetchIngredients = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token || !userId) {
      setError('No access token or user ID found. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/groceries/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        setError('Session expired. Please sign in again.');
        setLoading(false);
        window.location.reload();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch ingredients');
      }

      const data = await response.json();
      setIngredients(data);
      setError(null);
      // Reset removed items when ingredients are refreshed
      setRemovedItems(new Set());
      setFadingItems(new Set());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error fetching ingredients:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Listen for receipt upload events to refresh list
  useEffect(() => {
    const handleReceiptUploaded = () => {
      fetchIngredients();
    };

    window.addEventListener('receiptUploaded', handleReceiptUploaded);

    return () => {
      window.removeEventListener('receiptUploaded', handleReceiptUploaded);
    };
  }, [userId, fetchIngredients]);

  // Filter items expiring within the next 7 days (for the pool of items to show)
  const expiringSoonItemsPool = useMemo(() => {
    return ingredients.filter((item) => {
      const daysUntilExpiration = getDaysUntilExpiration(item);
      // Include items that expire within the next 7 days (0-7 days)
      return daysUntilExpiration !== null && daysUntilExpiration >= 0 && daysUntilExpiration <= 7;
    });
  }, [ingredients]);

  // Sort by days until expiration (soonest first)
  const sortedExpiringItems = useMemo(() => {
    return [...expiringSoonItemsPool].sort((a, b) => {
      const daysA = getDaysUntilExpiration(a);
      const daysB = getDaysUntilExpiration(b);
      
      if (daysA === null && daysB === null) return 0;
      if (daysA === null) return 1;
      if (daysB === null) return -1;
      
      return daysA - daysB;
    });
  }, [expiringSoonItemsPool]);

  // Filter out removed items and limit to top 3 visible items
  const visibleItems = useMemo(() => {
    const available = sortedExpiringItems.filter(item => !removedItems.has(item.id));
    return available.slice(0, 3);
  }, [sortedExpiringItems, removedItems]);

  const handleItemChecked = (itemId: string) => {
    // Start fade animation
    setFadingItems(prev => new Set(prev).add(itemId));
    
    // Remove item after animation
    setTimeout(() => {
      setRemovedItems(prev => new Set(prev).add(itemId));
      setFadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }, 300); // 300ms fade duration
  };

  if (loading) {
    return <IngredientSkeleton />;
  }

  if (error) {
    return null; // Silently fail to not disrupt the UI
  }

  return (
    <div className="mt-4 w-full">
      <div 
        className="rounded-lg p-2.5 relative"
        style={{
          backgroundColor: '#E8F5E9',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2 bg-transparent">
          {/* Clock/Alert Icon */}
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>
            Expiring soon
          </h2>
        </div>

        {/* Upload and Camera Buttons - Only show when no ingredients */}
        {visibleItems.length === 0 && (onUploadClick || onFileChange) && (
          <div className="flex gap-2 mb-2">
            {/* Upload Image Button */}
            <button
              onClick={handleUploadClick}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              style={{
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#354A33' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-medium" style={{ color: '#354A33' }}>
                Upload Image
              </span>
            </button>

            {/* Camera Button */}
            <button
              onClick={handleCameraClick}
              className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              style={{
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#354A33' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-medium" style={{ color: '#354A33' }}>
                Take Photo
              </span>
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        {onFileChange && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
          </>
        )}

        {/* Content */}
        {visibleItems.length === 0 && sortedExpiringItems.length === 0 ? (
          <div className="py-3 text-center pb-8">
            <p className="text-sm font-medium" style={{ color: '#354A33' }}>
              Yay, nothing is about to expire soon!
            </p>
          </div>
        ) : visibleItems.length > 0 ? (
          <div className="space-y-1.5 pb-8">
            {visibleItems.map((ingredient) => (
              <ExpiringIngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                isFading={fadingItems.has(ingredient.id)}
                onChecked={() => handleItemChecked(ingredient.id)}
              />
            ))}
          </div>
        ) : null}

        {/* View all ingredients button - bottom right corner */}
        <button
          onClick={() => router.push('/ingredients')}
          className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-1 rounded-full bg-white hover:bg-gray-50 transition-colors"
          style={{
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
          }}
        >
          <svg 
            className="w-3 h-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-[10px]" style={{ color: '#354A33', opacity: 0.7 }}>
            View all
          </span>
        </button>
      </div>
    </div>
  );
}

