"use client";

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, AlertCircle, CheckCircle, MoreVertical, Trash2, Minus, Plus } from 'lucide-react';
import { IngredientSkeleton } from '../components/common/SkeletonLoader';
import { Checkbox } from '../../components/ui/checkbox';
import CalendarOverlay from '../components/calendar/CalendarOverlay';

interface GroceryItem {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
  // optional future fields
  category?: string | null;
  count?: number; // Add count property to the base item
}

interface AggregatedItem {
  key: string; // name-based key
  name: string;
  ids: string[];
  count: number;
  expiresInDays: number | null;
  category?: string | null;
}

const COLORS = {
  primary: '#354A33',
  light: '#CBDFC9',
  medium: '#95C590',
  secondary: '#4A614F',
  alert: '#DC2626',
};

export default function IngredientsPage() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteAmounts, setDeleteAmounts] = useState<Record<string, number>>({});
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchIngredients = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found. Please sign in again.');
      setLoading(false);
      return;
    }
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setError('No user ID found. Please sign in again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/groceries/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        setError('Session expired. Please sign in again.');
        setLoading(false);
        router.push('/');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch ingredients');
      }

      const data: GroceryItem[] = await response.json();
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

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    const handleReceiptUploaded = () => {
      fetchIngredients();
    };
    window.addEventListener('receiptUploaded', handleReceiptUploaded);
    return () => {
      window.removeEventListener('receiptUploaded', handleReceiptUploaded);
    };
  }, []);

  const getExpiresInDays = (item: GroceryItem): number | null => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const created = new Date(item.created_at);
    created.setHours(0, 0, 0, 0);
    let expiration: Date | null = null;
    if (item.max_days !== null) {
      expiration = new Date(created);
      expiration.setDate(expiration.getDate() + item.max_days);
    } else if (item.min_days !== null) {
      expiration = new Date(created);
      expiration.setDate(expiration.getDate() + item.min_days);
    }
    if (!expiration) return null;
    return Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Group by name, compute count and soonest expiration
  const aggregated: AggregatedItem[] = useMemo(() => {
    const map = new Map<string, AggregatedItem>();
    for (const it of ingredients) {
      const key = it.name.trim().toLowerCase();
      const days = getExpiresInDays(it);
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: it.name,
          ids: [it.id],
          count: it.count || 1, // Default to 1 if count is not defined
          expiresInDays: days,
          category: it.category ?? null,
        });
      } else {
        const agg = map.get(key)!;
        agg.ids.push(it.id);
        agg.count += it.count || 1; // Use the item's count or default 1
        if (agg.expiresInDays === null) {
          agg.expiresInDays = days;
        } else if (days !== null) {
          agg.expiresInDays = Math.min(agg.expiresInDays, days);
        }
        if (!agg.category && it.category) agg.category = it.category;
      }
    }
    return Array.from(map.values());
  }, [ingredients]);

  // Search by name and category
  const filtered: AggregatedItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return aggregated;
    return aggregated.filter((it) =>
      it.name.toLowerCase().includes(q) || (it.category ?? '').toLowerCase().includes(q)
    );
  }, [aggregated, searchQuery]);

  // Auto-sort by expiresInDays ascending (nulls last)
  const sorted: AggregatedItem[] = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = a.expiresInDays;
      const db = b.expiresInDays;
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }, [filtered]);

  // New toggle selection for card-based view
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        // Remove from selected and deleteAmounts
        setDeleteAmounts((current) => {
          const newAmounts = { ...current };
          delete newAmounts[id];
          return newAmounts;
        });
        return prev.filter(selectedId => selectedId !== id);
      } else {
        // Add to selected and initialize delete amount
        const ingredient = ingredients.find(i => i.id === id);
        if (ingredient) {
          setDeleteAmounts((current) => ({
            ...current,
            [id]: 1 // Default delete amount is 1
          }));
        }
        return [...prev, id];
      }
    });
  };
  
  const handleUpdateDeleteAmount = (id: string, newAmount: number) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (!ingredient) return;
    
    // Clamp the amount between 1 and the count
    const clampedAmount = Math.max(1, Math.min(newAmount, ingredient.count || 1));
    
    setDeleteAmounts(prev => ({
      ...prev,
      [id]: clampedAmount
    }));
  };
  
  const handleRemoveIngredient = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found. Please sign in again.');
      router.push('/');
      return;
    }

    const ingredient = ingredients.find(i => i.id === id);
    const count = ingredient?.count || 1;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/groceries/${id}?by=${count}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        setError('Session expired. Please sign in again.');
        router.push('/');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to delete ingredient with ID: ${id}`);
      }

      // After deletion, re-fetch the ingredients to update the list
      await fetchIngredients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error deleting ingredient:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteSelected = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found. Please sign in again.');
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      // Process each selected ingredient
      for (const id of selectedIds) {
        const ingredient = ingredients.find(i => i.id === id);
        if (!ingredient) continue;
        
        const deleteAmount = deleteAmounts[id] || ingredient.count || 1;
        
        const response = await fetch(`http://localhost:8000/api/groceries/${id}?by=${deleteAmount}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_id');
          setError('Session expired. Please sign in again.');
          router.push('/');
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to delete ingredient with ID: ${id}`);
        }
      }
      
      // After all deletions, re-fetch the ingredients to update the list
      await fetchIngredients();
      setSelectedIds([]);
      setDeleteAmounts({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error deleting ingredients:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundColor = (days: number | null) => {
    if (days !== null && days <= 3) return 'rgba(254, 226, 226, 0.4)'; // light red
    if (days !== null && days > 7) return 'rgba(220, 252, 231, 0.3)'; // light green
    return 'transparent';
  };

  const getExpiryText = (days: number | null) => {
    if (days === null) return '—';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const getExpiryColor = (days: number | null) => {
    if (days !== null && days <= 3) return COLORS.alert;
    return COLORS.secondary;
  };

  const getStatusIcon = (days: number | null) => {
    if (days !== null && days <= 3) {
      return <AlertCircle className="w-5 h-5" color={COLORS.alert} />;
    }
    if (days !== null && days > 7) {
      return <CheckCircle className="w-5 h-5" color={COLORS.primary} />;
    }
    return <MoreVertical className="w-5 h-5" color={COLORS.secondary} />;
  };

  return (
    <div
      className="min-h-screen flex flex-col px-4 md:px-6 pb-20 md:pb-8"
      style={{ background: 'linear-gradient(180deg, #CBDFC9 32%, #95C590 100%)' }}
    >
      {/* Header Section */}
      <header className="pt-4 md:pt-8 pb-2 md:pb-4">
        <button
          onClick={() => router.push('/')}
          className="mb-2 md:mb-4 p-0 bg-transparent"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6" color={COLORS.primary} />
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: COLORS.primary }}>
          Ingredients
        </h1>
      </header>

      {/* Search & Filter Bar */}
      <div className="px-4 md:px-6 pb-3 md:pb-4 flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5"
            color={COLORS.primary}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full pl-10 md:pl-11 pr-3 md:pr-4 py-2.5 md:py-3 rounded-lg bg-white outline-none transition-all focus:ring-2 focus:ring-opacity-50 text-sm md:text-base"
            style={{
              borderColor: COLORS.light,
              borderWidth: '1px',
              color: COLORS.primary,
              focusOutlineColor: COLORS.medium,
            }}
          />
        </div>

        {/* Filter Button */}
        <button
          className="rounded-lg bg-white px-3 md:px-4 py-2.5 md:py-3 transition-transform hover:scale-105 active:scale-95"
          style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)' }}
          aria-label="Filter ingredients"
        >
          <Filter className="w-4 md:w-5 h-4 md:h-5" color={COLORS.primary} />
        </button>
      </div>

      {/* Main Content Container */}
      <div
        className="bg-white rounded-lg overflow-auto"
        style={{
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          height: 'max-content',
          minHeight: '200px'
        }}
      >
        {/* Mobile Card View */}
        {loading ? (
          <div className="p-4">
            <IngredientSkeleton />
          </div>
        ) : error ? (
          <div className="p-4 text-sm" style={{ color: COLORS.alert }}>
            Error: {error}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: COLORS.secondary }}>
            No ingredients found.
          </div>
        ) : (
          <div style={{ borderColor: COLORS.light }} className="divide-y">
            {sorted.map((ingredient) => {
              const isAnySelected = ingredient.ids.some((id) => selectedIds.includes(id));
              const firstSelectedId = ingredient.ids.find((id) => selectedIds.includes(id));
              const deleteAmount = firstSelectedId ? deleteAmounts[firstSelectedId] || ingredient.count : 0;
              const days = ingredient.expiresInDays;

              return (
                <div
                  key={ingredient.key}
                  className="px-3 py-2.5 transition-all"
                  style={{ backgroundColor: getBackgroundColor(days) }}
                >
                  {/* Card Row 1 - Checkbox, Name, Delete */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isAnySelected}
                      onCheckedChange={() => {
                        // Toggle the first ID
                        if (ingredient.ids.length > 0) {
                          handleToggleSelect(ingredient.ids[0]);
                        }
                      }}
                      aria-label="Select ingredient"
                    />

                    {/* Ingredient Name */}
                    <span className="flex-1 text-sm" style={{ color: COLORS.primary }}>
                      {ingredient.name}
                    </span>

                    {/* Individual Delete Button */}
                    <button
                      className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
                      onClick={() => {
                        if (ingredient.ids.length > 0) {
                          handleRemoveIngredient(ingredient.ids[0]);
                        }
                      }}
                      aria-label="Remove ingredient"
                    >
                      <Trash2 className="w-4 h-4" color={COLORS.alert} />
                    </button>
                  </div>

                  {/* Card Row 2 - Count Controls/Display and Expiry Info */}
                  <div className="flex items-center justify-between pl-7">
                    {/* Left Side - Count Section */}
                    <div className="flex items-center gap-1.5">
                      {!isAnySelected ? (
                        <>
                          <span className="text-xs" style={{ color: COLORS.secondary }}>
                            Count:
                          </span>
                          <span className="text-sm font-medium" style={{ color: COLORS.primary }}>
                            {ingredient.count}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs" style={{ color: COLORS.secondary }}>
                            Remove:
                          </span>

                          {/* Minus Button */}
                          <button
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                            onClick={() => {
                              if (firstSelectedId) {
                                handleUpdateDeleteAmount(firstSelectedId, deleteAmount - 1);
                              }
                            }}
                            disabled={deleteAmount <= 1}
                            aria-label="Decrease delete amount"
                          >
                            <Minus className="w-3.5 h-3.5" color={COLORS.primary} />
                          </button>

                          {/* Fraction Display */}
                          <div className="min-w-[60px] text-center">
                            <span className="text-sm font-medium" style={{ color: COLORS.alert }}>
                              {deleteAmount}/{ingredient.count}
                            </span>
                          </div>

                          {/* Plus Button */}
                          <button
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors active:scale-95"
                            onClick={() => {
                              if (firstSelectedId) {
                                handleUpdateDeleteAmount(firstSelectedId, deleteAmount + 1);
                              }
                            }}
                            disabled={deleteAmount >= ingredient.count}
                            aria-label="Increase delete amount"
                          >
                            <Plus className="w-3.5 h-3.5" color={COLORS.primary} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Right Side - Expiry Section */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs ${days !== null && days <= 3 ? 'font-medium' : ''}`}
                        style={{ color: getExpiryColor(days) }}
                      >
                        {getExpiryText(days)}
                      </span>
                      <div className="scale-90">{getStatusIcon(days)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Floating Delete Button */}
      {selectedIds.length > 0 && (
        <button
          onClick={handleDeleteSelected}
          className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 md:px-6 py-2.5 md:py-3 font-medium text-sm md:text-base transition-transform hover:scale-105 active:scale-95 text-white flex items-center gap-2"
          style={{
            backgroundColor: COLORS.alert,
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Trash2 className="w-4 md:w-5 h-4 md:h-5" color="white" />
          <span>Remove selected</span>
        </button>
      )}

      <CalendarOverlay
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        token={typeof window !== 'undefined' ? localStorage.getItem('access_token') : null} 
      />
    </div>
  );
}
