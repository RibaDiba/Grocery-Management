"use client";

import React, { useState } from 'react';

interface GroceryRow {
  id: string;
  name: string;
  count: number;
}

interface ManualGroceriesInputProps {
  onClose: () => void;
}

// Contract:
// Inputs: list of rows {name, count}; submit aggregates into multiline "Name x Count" lines to backend analyze-text endpoint.
// Output: calls backend, returns success popup event, closes overlay on success.
// Errors: network errors surfaced inline.
export default function ManualGroceriesInput({ onClose }: ManualGroceriesInputProps) {
  const [rows, setRows] = useState<GroceryRow[]>([
    { id: crypto.randomUUID(), name: '', count: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const addRow = () => {
    setRows(r => [...r, { id: crypto.randomUUID(), name: '', count: 1 }]);
  };
  const removeRow = (id: string) => {
    setRows(r => r.filter(row => row.id !== id));
  };
  const updateName = (id: string, name: string) => {
    setRows(r => r.map(row => row.id === id ? { ...row, name } : row));
  };
  const updateCount = (id: string, count: number) => {
    setRows(r => r.map(row => row.id === id ? { ...row, count: Math.max(1, count) } : row));
  };

  const canSubmit = rows.some(r => r.name.trim().length > 0) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('Not authenticated');
      const payloadText = rows
        .filter(r => r.name.trim())
        .map(r => `${r.name.trim()} x ${r.count}`)
        .join('\n');
      const res = await fetch('http://localhost:8000/api/receipt/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: payloadText })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to add groceries');
      }
      const data = await res.json();
      setSuccessMsg(`Added ${data.total_items} item${data.total_items !== 1 ? 's' : ''}`);
      // Notify global listeners (e.g., IngredientsList refresh)
      window.dispatchEvent(new CustomEvent('ingredientsUpdated'));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>Add Groceries Manually</h2>
        <button
          onClick={onClose}
          className="text-sm px-3 py-1 rounded-md bg-black/5 hover:bg-black/10"
        >Close</button>
      </div>

      <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {rows.map((row, idx) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Item ${idx + 1}`}
              value={row.name}
              onChange={e => updateName(row.id, e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <input
              type="number"
              min={1}
              value={row.count}
              onChange={e => updateCount(row.id, parseInt(e.target.value) || 1)}
              className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
            <button
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm hover:bg-black/5 disabled:opacity-40"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={addRow}
          className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 hover:bg-black/5"
        >
          Add Item
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 rounded-md text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#354A33' }}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
      {successMsg && (
        <p className="text-sm text-green-700" role="status">{successMsg}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Tip: Leave blank rows unused. Each saved line becomes one grocery with the specified count.
      </p>
    </div>
  );
}
