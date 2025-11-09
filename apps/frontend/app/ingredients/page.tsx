"use client";

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';
import { IngredientSkeleton } from '../components/common/SkeletonLoader';
import { Checkbox } from '../../components/ui/checkbox';
import CalendarOverlay from '../components/calendar/CalendarOverlay';
import EmptyGroceriesState from '../components/groceries/EmptyGroceriesState';

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

// Expiration thresholds (in days)
const EXPIRATION_THRESHOLDS = {
  CRITICAL: 1,    // 1 day or less - Critical (dark red)
  WARNING: 3,     // 2-3 days - Warning (orange/red)
  CAUTION: 7,     // 4-7 days - Caution (light orange)
  GOOD: 14,       // 8-14 days - Good (green)
  // 15+ days - Excellent (darker green)
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
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'caution' | 'good' | 'excellent'>('all');

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
    const handleIngredientsUpdated = () => {
      fetchIngredients();
    };
    window.addEventListener('receiptUploaded', handleReceiptUploaded);
    window.addEventListener('ingredientsUpdated', handleIngredientsUpdated);
    return () => {
      window.removeEventListener('receiptUploaded', handleReceiptUploaded);
      window.removeEventListener('ingredientsUpdated', handleIngredientsUpdated);
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

  // Helper function to get expiration status
  const getExpirationStatus = (days: number | null): 'critical' | 'warning' | 'caution' | 'good' | 'excellent' | 'unknown' => {
    if (days === null) return 'unknown';
    if (days <= EXPIRATION_THRESHOLDS.CRITICAL) return 'critical';
    if (days <= EXPIRATION_THRESHOLDS.WARNING) return 'warning';
    if (days <= EXPIRATION_THRESHOLDS.CAUTION) return 'caution';
    if (days <= EXPIRATION_THRESHOLDS.GOOD) return 'good';
    return 'excellent';
  };

  // Search by name and category
  const searchFiltered: AggregatedItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return aggregated;
    return aggregated.filter((it) =>
      it.name.toLowerCase().includes(q) || (it.category ?? '').toLowerCase().includes(q)
    );
  }, [aggregated, searchQuery]);

  // Apply expiration filter
  const filtered: AggregatedItem[] = useMemo(() => {
    if (activeFilter === 'all') return searchFiltered;
    
    return searchFiltered.filter((item) => {
      const status = getExpirationStatus(item.expiresInDays);
      return status === activeFilter;
    });
  }, [searchFiltered, activeFilter]);

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

  const handleIncrementCount = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found. Please sign in again.');
      return;
    }

    const ingredient = ingredients.find(i => i.id === id);
    if (!ingredient) return;

    try {
      const response = await fetch('http://localhost:8000/api/groceries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: ingredient.name,
          min_days: ingredient.min_days,
          max_days: ingredient.max_days,
        }),
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
        throw new Error(errorData.detail || 'Failed to increment count');
      }

      await fetchIngredients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
    }
  };

  const handleDecrementCount = async (id: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found. Please sign in again.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/groceries/${id}?by=1`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        throw new Error(errorData.detail || 'Failed to decrement count');
      }

      await fetchIngredients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error';
      setError(errorMessage);
    }
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

    setError(null);
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
            'Authorization': `Bearer ${token}`,
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
    if (days === null) return 'transparent';
    
    if (days <= EXPIRATION_THRESHOLDS.CRITICAL) {
      return 'rgba(239, 68, 68, 0.15)'; // Critical - strong red highlight
    }
    if (days <= EXPIRATION_THRESHOLDS.WARNING) {
      return 'rgba(249, 115, 22, 0.12)'; // Warning - orange-red highlight
    }
    if (days <= EXPIRATION_THRESHOLDS.CAUTION) {
      return 'rgba(245, 158, 11, 0.08)'; // Caution - light orange highlight
    }
    if (days <= EXPIRATION_THRESHOLDS.GOOD) {
      return 'rgba(34, 197, 94, 0.06)'; // Good - very light green
    }
    
    return 'rgba(22, 163, 74, 0.08)'; // Excellent - light green highlight
  };

  const getExpiryText = (days: number | null) => {
    if (days === null) return '—';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const getExpiryColor = (days: number | null) => {
    if (days === null) return COLORS.secondary;
    
    if (days <= EXPIRATION_THRESHOLDS.CRITICAL) {
      return '#DC2626'; // Critical - dark red
    }
    if (days <= EXPIRATION_THRESHOLDS.WARNING) {
      return '#EA580C'; // Warning - orange-red
    }
    if (days <= EXPIRATION_THRESHOLDS.CAUTION) {
      return '#D97706'; // Caution - orange
    }
    if (days <= EXPIRATION_THRESHOLDS.GOOD) {
      return '#059669'; // Good - green
    }
    
    return '#047857'; // Excellent - darker green
  };

  const getStatusIcon = (days: number | null) => {
    if (days === null) return null;
    
    if (days <= EXPIRATION_THRESHOLDS.CRITICAL) {
      return <AlertCircle className="w-4 h-4" color="#DC2626" />; // Critical - red alert
    }
    if (days <= EXPIRATION_THRESHOLDS.WARNING) {
      return <AlertCircle className="w-4 h-4" color="#EA580C" />; // Warning - orange alert
    }
    if (days <= EXPIRATION_THRESHOLDS.CAUTION) {
      return <AlertCircle className="w-4 h-4" color="#D97706" />; // Caution - orange alert
    }
    if (days <= EXPIRATION_THRESHOLDS.GOOD) {
      return <CheckCircle className="w-4 h-4" color="#059669" />; // Good - green check
    }
    
    return <CheckCircle className="w-4 h-4" color="#047857" />; // Excellent - darker green check
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: COLORS.primary }}>
            Groceries
          </h1>
          {activeFilter !== 'all' && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: activeFilter === 'critical' ? '#DC2626' : 
                                 activeFilter === 'warning' ? '#EA580C' : 
                                 activeFilter === 'caution' ? '#D97706' : 
                                 activeFilter === 'good' ? '#059669' : '#047857'
                }}
              />
              <span className="text-xs font-medium" style={{ color: COLORS.primary }}>
                {activeFilter === 'critical' ? 'Critical' : 
                 activeFilter === 'warning' ? 'Warning' : 
                 activeFilter === 'caution' ? 'Caution' : 
                 activeFilter === 'good' ? 'Good' : 'Excellent'} Filter
              </span>
              <button 
                onClick={() => setActiveFilter('all')}
                className="text-xs text-gray-500 hover:text-gray-700 ml-1"
              >
                ✕
              </button>
            </div>
          )}
        </div>
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
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`rounded-lg bg-white px-3 md:px-4 py-2.5 md:py-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              activeFilter !== 'all' ? 'ring-2 ring-orange-300 bg-orange-50' : ''
            }`}
            style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)' }}
            aria-label="Filter ingredients"
          >
            <Filter className="w-4 md:w-5 h-4 md:h-5" color={activeFilter !== 'all' ? '#EA580C' : COLORS.primary} />
          </button>

          {/* Filter Dropdown */}
          {showFilter && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowFilter(false)}
              />
              
              {/* Filter Menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                <div className="py-2">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                    Filter by Expiration
                  </div>
                  
                  {[
                    { key: 'all', label: 'All Items', color: COLORS.secondary, count: aggregated.length },
                    { key: 'critical', label: 'Critical (≤1 day)', color: '#DC2626', count: aggregated.filter(i => getExpirationStatus(i.expiresInDays) === 'critical').length },
                    { key: 'warning', label: 'Warning (2-3 days)', color: '#EA580C', count: aggregated.filter(i => getExpirationStatus(i.expiresInDays) === 'warning').length },
                    { key: 'caution', label: 'Caution (4-7 days)', color: '#D97706', count: aggregated.filter(i => getExpirationStatus(i.expiresInDays) === 'caution').length },
                    { key: 'good', label: 'Good (8-14 days)', color: '#059669', count: aggregated.filter(i => getExpirationStatus(i.expiresInDays) === 'good').length },
                    { key: 'excellent', label: 'Excellent (15+ days)', color: '#047857', count: aggregated.filter(i => getExpirationStatus(i.expiresInDays) === 'excellent').length }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setActiveFilter(filter.key as any);
                        setShowFilter(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between transition-colors ${
                        activeFilter === filter.key ? 'bg-gray-100 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: filter.color }}
                        />
                        <span>{filter.label}</span>
                      </div>
                      <span className="text-xs text-gray-500">({filter.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="px-4 md:px-6">
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
          <EmptyGroceriesState 
            onAddManually={() => {
              // Trigger manual input - this could be connected to parent component
              window.dispatchEvent(new CustomEvent('openManualInput'));
            }}
            onUploadReceipt={() => {
              // Trigger file upload - this could be connected to parent component
              window.dispatchEvent(new CustomEvent('openFileUpload'));
            }}
          />
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

                          {/* Minus Button */}
                          <button
                            className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
                            onClick={() => handleDecrementCount(ingredient.ids[0])}
                            aria-label="Decrease count"
                          >
                            <Minus className="w-3 h-3" color={COLORS.primary} />
                          </button>

                          <span className="text-sm font-medium min-w-[30px] text-center" style={{ color: COLORS.primary }}>
                            {ingredient.count}
                          </span>

                          {/* Plus Button */}
                          <button
                            className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
                            onClick={() => handleIncrementCount(ingredient.ids[0])}
                            aria-label="Increase count"
                          >
                            <Plus className="w-3 h-3" color={COLORS.primary} />
                          </button>
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
                        className={`text-xs ${
                          days !== null && days <= EXPIRATION_THRESHOLDS.WARNING
                            ? 'font-semibold'
                            : days !== null && days <= EXPIRATION_THRESHOLDS.CAUTION
                            ? 'font-medium'
                            : 'font-normal'
                        }`}
                        style={{ color: getExpiryColor(days) }}
                      >
                        {getExpiryText(days)}
                      </span>
                      {getStatusIcon(days)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Floating Delete Button - Positioned above navbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-32 left-0 right-0 flex justify-center z-[9999] pointer-events-none">
          <button
            onClick={handleDeleteSelected}
            disabled={loading}
            className="pointer-events-auto bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {loading ? 'Removing...' : `Remove ${selectedIds.length} selected`}
          </button>
        </div>
      )}

      <CalendarOverlay
        isOpen={showCalendar} 
        onClose={() => setShowCalendar(false)} 
        token={typeof window !== 'undefined' ? localStorage.getItem('access_token') : null} 
      />
    </div>
  );
}
