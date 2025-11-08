"use client";

import { useState, useEffect, useMemo } from 'react';
import IngredientCard from './IngredientCard';

interface GroceryItem {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
}

export default function IngredientsList({ userId }: { userId: string | null }) {
  const [ingredients, setIngredients] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIngredients = async () => {
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

        if (!response.ok) {
          const errorData = await response.json();
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
    };

    fetchIngredients();
  }, [userId]);

  // Get unique ingredient names (in case there are duplicates)
  // Must be called before conditional returns to follow Rules of Hooks
  const uniqueIngredients = useMemo(() => {
    return Array.from(
      new Map(ingredients.map(item => [item.name.toLowerCase(), item])).values()
    );
  }, [ingredients]);

  // Sort ingredients by expiration date (closest to expiring first)
  // Must be called before conditional returns to follow Rules of Hooks
  const sortedIngredients = useMemo(() => {
    const now = new Date();
    
    return [...uniqueIngredients].sort((a, b) => {
      const getExpirationDate = (item: GroceryItem): Date | null => {
        if (item.max_days !== null) {
          const createdDate = new Date(item.created_at);
          const expirationDate = new Date(createdDate);
          expirationDate.setDate(expirationDate.getDate() + item.max_days);
          return expirationDate;
        } else if (item.min_days !== null) {
          const createdDate = new Date(item.created_at);
          const expirationDate = new Date(createdDate);
          expirationDate.setDate(expirationDate.getDate() + item.min_days);
          return expirationDate;
        }
        return null;
      };

      const expirationA = getExpirationDate(a);
      const expirationB = getExpirationDate(b);

      // Items with no expiration date go to the end
      if (!expirationA && !expirationB) return 0;
      if (!expirationA) return 1;
      if (!expirationB) return -1;

      // Sort by expiration date (closest first)
      return expirationA.getTime() - expirationB.getTime();
    });
  }, [uniqueIngredients]);

  if (loading) {
    return (
      <div className="mt-8 w-full">
        <p className="text-gray-700">Loading ingredients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 w-full">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full">
      <h2 className="text-2xl font-semibold mb-4 text-green-800">
        Ingredients ({sortedIngredients.length})
      </h2>
      {sortedIngredients.length === 0 ? (
        <p className="text-gray-600">No ingredients found. Upload receipts to add ingredients.</p>
      ) : (
        <div className="space-y-3">
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
      )}
    </div>
  );
}

