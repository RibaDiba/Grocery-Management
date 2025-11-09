"use client";

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IngredientSkeleton } from '../components/SkeletonLoader';

interface GroceryItem {
  id: string;
  name: string;
  min_days: number | null;
  max_days: number | null;
  created_at: string;
  // optional future fields
  category?: string | null;
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
          count: 1,
          expiresInDays: days,
          category: it.category ?? null,
        });
      } else {
        const agg = map.get(key)!;
        agg.ids.push(it.id);
        agg.count += 1;
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

  const toggleRowSelection = (ids: string[]) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      const anySelected = ids.some((id) => set.has(id));
      if (anySelected) {
        ids.forEach((id) => set.delete(id));
      } else {
        ids.forEach((id) => set.add(id));
      }
      return Array.from(set);
    });
  };


  const deleteSelected = () => {
    setIngredients((prev) => prev.filter((it) => !selectedIds.includes(it.id)));
    setSelectedIds([]);
  };

  const rowTint = (days: number | null) => {
    if (days !== null && days <= 3) return 'rgba(254, 226, 226, 0.4)'; // light red
    if (days !== null && days > 7) return 'rgba(220, 252, 231, 0.3)'; // light green
    return 'white';
  };

  const expiresLabel = (days: number | null) => {
    if (days === null) return '—';
    const abs = Math.abs(days);
    return `${abs} day${abs === 1 ? '' : 's'}`;
  };

  const expiresColor = (days: number | null) => {
    if (days !== null && days <= 3) return COLORS.alert;
    return COLORS.secondary;
  };

  const statusIcon = (days: number | null) => {
    if (days !== null && days <= 3) {
      // AlertCircle
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.alert} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <circle cx="12" cy="16" r="1" fill={COLORS.alert} stroke={COLORS.alert} />
        </svg>
      );
    }
    if (days !== null && days > 7) {
      // CheckCircle
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }
    // MoreVertical
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth={2}>
        <circle cx="12" cy="5" r="1" fill={COLORS.secondary} stroke={COLORS.secondary} />
        <circle cx="12" cy="12" r="1" fill={COLORS.secondary} stroke={COLORS.secondary} />
        <circle cx="12" cy="19" r="1" fill={COLORS.secondary} stroke={COLORS.secondary} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #CBDFC9 32%, #95C590 100%)' }}>
      {/* Header */}
      <header className="w-full px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white"
          style={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}
          aria-label="Back"
        >
          {/* ArrowLeft */}
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-3xl font-semibold" style={{ color: COLORS.primary }}>Ingredients</h1>
      </header>

      {/* Search + Filter */}
      <div className="w-full max-w-3xl mx-auto px-4 mt-2 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2 border" style={{ borderColor: COLORS.light }}>
          {/* Search icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.secondary} strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full outline-none text-sm"
            style={{ color: COLORS.primary }}
          />
        </div>
        <button className="flex items-center justify-center bg-white rounded-lg px-3 py-2 border" style={{ borderColor: COLORS.light }}>
          {/* Filter icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth={2}>
            <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Table container */}
      <div className="w-full max-w-3xl mx-auto px-4 mt-4 pb-28">
        <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)' }}>
          {/* Header row */}
          <div className="grid grid-cols-5 items-center px-4 py-3" style={{ backgroundColor: '#F8FAF8', color: COLORS.secondary }}>
            <div className="text-xs uppercase tracking-wide">Select</div>
            <div className="text-xs uppercase tracking-wide">Name</div>
            <div className="text-xs uppercase tracking-wide w-20">Count</div>
            <div className="text-xs uppercase tracking-wide">Expires</div>
            <div className="text-xs uppercase tracking-wide">Status</div>
          </div>

          {/* Body rows */}
          {loading ? (
            <div className="p-4"><IngredientSkeleton /></div>
          ) : error ? (
            <div className="p-4 text-sm" style={{ color: COLORS.alert }}>Error: {error}</div>
          ) : sorted.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: COLORS.secondary }}>No ingredients found.</div>
          ) : (
            <div>
              {sorted.map((row) => {
                const isSelected = row.ids.some((id) => selectedIds.includes(id));
                const days = row.expiresInDays;
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-5 items-center px-4 py-3 border-t"
                    style={{ backgroundColor: rowTint(days), borderColor: '#F1F5F1' }}
                  >
                    {/* Checkbox */}
                    <div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border"
                          style={{ borderColor: COLORS.light }}
                          checked={isSelected}
                          onChange={() => toggleRowSelection(row.ids)}
                        />
                      </label>
                    </div>
                    {/* Name */}
                    <div className="truncate font-medium" style={{ color: COLORS.primary }}>{row.name}</div>
                    {/* Count */}
                    <div className="w-20 font-semibold" style={{ color: COLORS.secondary }}>{row.count}</div>
                    {/* Expires */}
                    <div className="font-medium" style={{ color: expiresColor(days) }}>{expiresLabel(days)}</div>
                    {/* Status icon */}
                    <div className="flex items-center">{statusIcon(days)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating bulk delete button */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <button
            onClick={deleteSelected}
            className="px-5 py-3 rounded-full text-white font-medium flex items-center gap-2 transition-transform hover:scale-105"
            style={{ backgroundColor: COLORS.alert, boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span>Delete {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
