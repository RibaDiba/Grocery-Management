"use client";

import { useState } from 'react';

interface EditNameModalProps {
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
}

export default function EditNameModal({ currentName, onClose, onSave }: EditNameModalProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (name.trim() === currentName) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(name.trim());
      onClose();
    } catch (err) {
      setError('Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md rounded-xl p-6"
        style={{ backgroundColor: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          className="text-2xl font-bold mb-4"
          style={{ color: '#2D5016' }}
        >
          Edit Name
        </h2>
        
        {error && (
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ backgroundColor: '#fee', color: '#c00' }}
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: '#2D5016' }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-solid px-4 py-3"
            style={{
              color: '#000',
              borderColor: '#CBDFC9',
            }}
            placeholder="Enter your name"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg px-4 py-3 font-medium"
            style={{
              backgroundColor: '#f0f0f0',
              color: '#000',
            }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 rounded-lg px-4 py-3 font-medium"
            style={{
              backgroundColor: '#2D5016',
              color: '#fff',
            }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

