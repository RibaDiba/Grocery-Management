"use client";

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, AlertCircle, CheckCircle, MoreVertical, Trash2, Minus, Plus } from 'lucide-react';
import { IngredientSkeleton } from '../components/common/SkeletonLoader';
import { Checkbox } from '../../components/ui/checkbox';
import CalendarOverlay from '../components/calendar/CalendarOverlay';
import BottomNav from '../components/layout/BottomNav';
import SuccessPopup from '../components/common/SuccessPopup';
import { useReceiptUpload } from '../hooks/useReceiptUpload';

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
  const [fabOpen, setFabOpen] = useState(false);
  const { fileInputRef, uploading, uploadSuccess, uploadError, uploadResult, handleFileSelect, handleFileChange } = useReceiptUpload();

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

      {/* Backdrop Blur Overlay */}
      {fabOpen && (
        <div 
          className="fixed inset-0 z-25 transition-opacity duration-300"
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }}
          onClick={() => setFabOpen(false)}
        />
      )}

      {/* Floating Action Buttons */}
      <div className="fixed left-1/2 transform -translate-x-1/2 bottom-12 z-30 flex flex-col items-center">
        {/* Document/Pencil Icon Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => setFabOpen(false)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: COLORS.primary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: COLORS.primary }}>
            Input manually
          </span>
        </div>
        {/* Upload Receipt Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => {
              handleFileSelect();
              setFabOpen(false);
            }}
            disabled={uploading}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center disabled:opacity-50"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            {uploading ? (
              <svg 
                className="w-6 h-6 animate-spin" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: COLORS.primary }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ color: COLORS.primary }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 1 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: COLORS.primary }}>
            {uploading ? 'Uploading...' : 'Upload receipt'}
          </span>
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {/* Camera Button - Animated */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
            fabOpen ? 'opacity-100 translate-y-0 mb-4' : 'opacity-0 translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={() => setFabOpen(false)}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: COLORS.primary }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <span className="text-xs mt-1 font-medium" style={{ color: COLORS.primary }}>
            Receipt picture
          </span>
        </div>
        {/* Main Plus Button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center transition-transform duration-300"
          style={{
            boxShadow: '0px 8px 15px rgba(0, 0, 0, 0.2)',
            transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)'
          }}
        >
          <svg 
            className="w-8 h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: COLORS.primary }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
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

      {/* Error Messages */}
      {uploadError && (
        <div 
          className="fixed bottom-36 left-4 right-4 bg-red-50 border border-red-300 rounded-xl p-4 z-20 shadow-lg"
          style={{ color: '#c53030' }}
        >
          <div className="flex items-start gap-3">
            <svg 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <p className="font-medium text-sm">{uploadError}</p>
            </div>
          </div>
        </div>
      )}
      
      {uploadSuccess && uploadResult && (
        <SuccessPopup 
          message="Receipt uploaded successfully!"
          subMessage={`${uploadResult.total_items} item${uploadResult.total_items !== 1 ? 's' : ''} extracted`}
          onClose={() => {}}
        />
      )}

      <CalendarOverlay
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        token={typeof window !== 'undefined' ? localStorage.getItem('access_token') : null} 
      />

      <BottomNav 
        onCalendarClick={() => router.push('/calendar')}
        onProfileClick={() => {}}
        color={COLORS.primary}
      />
    </div>
  );
}
