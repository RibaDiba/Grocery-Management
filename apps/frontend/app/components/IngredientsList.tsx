"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import IngredientCard from './IngredientCard';
import { IngredientSkeleton } from './SkeletonLoader';
import { type WeekSelection } from './CalendarOverlay';

interface GroceryItem {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
}

interface IngredientsListProps {
  userId: string | null;
  selectedWeekRange?: WeekSelection | null;
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

export default function IngredientsList({ userId, selectedWeekRange = null }: IngredientsListProps) {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback to stabilize the function
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
        // Token is invalid or expired
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        setError('Session expired. Please sign in again.');
        setLoading(false);
        // Reload the page to reset state
        window.location.reload();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch ingredients');
      }

      const data = await response.json();
      
      // Log the result to console
      console.log('Ingredients fetched successfully:', data);
      console.log('Number of ingredients:', data.length);
      
      // Log each ingredient individually
      data.forEach((ingredient: GroceryItem, index: number) => {
        console.log(`Ingredient ${index + 1}:`, {
          id: ingredient.id,
          name: ingredient.name,
          min_days: ingredient.min_days,
          max_days: ingredient.max_days,
          created_at: ingredient.created_at,
        });
      });

      setIngredients(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error fetching ingredients:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial fetch when component mounts
  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Listen for receipt upload events to refresh list
  useEffect(() => {
    const handleReceiptUploaded = () => {
      // Refresh ingredients list after receipt upload
      fetchIngredients();
    };

    window.addEventListener('receiptUploaded', handleReceiptUploaded);

    return () => {
      window.removeEventListener('receiptUploaded', handleReceiptUploaded);
    };
  }, [userId, fetchIngredients]);

  // Get unique ingredient names (in case there are duplicates)
  // Must be called before conditional returns to follow Rules of Hooks
  const uniqueIngredients = useMemo(() => {
    return Array.from(
      new Map(ingredients.map(item => [item.name.toLowerCase(), item])).values()
    );
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    if (!selectedWeekRange) {
      return uniqueIngredients;
    }

    const { start, end } = selectedWeekRange;

    return uniqueIngredients.filter((item) => {
      const expirationDate = getExpirationDate(item);
      if (!expirationDate) {
        return false;
      }
      const expirationTime = expirationDate.getTime();
      return expirationTime >= start && expirationTime <= end;
    });
  }, [uniqueIngredients, selectedWeekRange]);

  // Sort ingredients by expiration date (closest to expiring first)
  // Must be called before conditional returns to follow Rules of Hooks
  const sortedIngredients = useMemo(() => {
    const sorted = [...filteredIngredients].sort((a, b) => {
      const expirationA = getExpirationDate(a);
      const expirationB = getExpirationDate(b);

      // Items with no expiration date go to the end
      if (!expirationA && !expirationB) return 0;
      if (!expirationA) return 1;
      if (!expirationB) return -1;

      // Sort by expiration date (closest first)
      return expirationA.getTime() - expirationB.getTime();
    });
    
    return selectedWeekRange ? sorted : sorted.slice(0, 3);
  }, [filteredIngredients, selectedWeekRange]);

  if (loading) {
    return <IngredientSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-8 w-full">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  const hasSelection = Boolean(selectedWeekRange);
  const headerTitle = hasSelection
    ? `Groceries expiring week of ${selectedWeekRange?.label ?? ''}`
    : 'Ingredients about to go bad';
  const emptyStateMessage = hasSelection
    ? 'No groceries expiring in this week.'
    : 'No ingredients found. Upload receipts to add ingredients.';

  return (
    <div className="mt-6 w-full">
      {sortedIngredients.length === 0 ? (
        <p className="text-gray-600">{emptyStateMessage}</p>
      ) : (
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
              {/* Warning Icon */}
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: '#354A33' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>
              {headerTitle}
              </h2>
            </div>
            {/* Arrow Icon */}
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#354A33' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Ingredient Cards */}
          <div className="space-y-2">
            {sortedIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                name={ingredient.name}
                created_at={ingredient.created_at}
                min_days={ingredient.min_days}
                max_days={ingredient.max_days}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

