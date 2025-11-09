"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FoodLogEntry {
  id: string;
  date: string;
  items: string[];
  source: 'manual' | 'receipt';
}

export default function FoodLogHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load food logs from localStorage
    const loadLogs = () => {
      try {
        const savedLogs = localStorage.getItem('food_logs');
        if (savedLogs) {
          setLogs(JSON.parse(savedLogs));
        } else {
          // Create some sample data for demonstration
          const sampleLogs: FoodLogEntry[] = [
            {
              id: '1',
              date: new Date().toISOString().split('T')[0],
              items: ['Apples', 'Bananas', 'Milk', 'Bread'],
              source: 'receipt'
            },
            {
              id: '2',
              date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
              items: ['Chicken', 'Rice', 'Broccoli'],
              source: 'manual'
            },
            {
              id: '3',
              date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
              items: ['Eggs', 'Cheese', 'Tomatoes', 'Lettuce'],
              source: 'receipt'
            }
          ];
          setLogs(sampleLogs);
          localStorage.setItem('food_logs', JSON.stringify(sampleLogs));
        }
      } catch (error) {
        console.error('Error loading food logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#E8F5E9' }}
      >
        <p style={{ color: '#2D5016' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col pb-20"
      style={{ backgroundColor: '#E8F5E9' }}
    >
      {/* Header */}
      <div className="pt-16 pb-5 px-5">
        <button 
          onClick={() => router.back()}
          className="mb-5 p-2 -ml-2"
          aria-label="Go back"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#000' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 
          className="text-3xl font-bold mb-2"
          style={{ color: '#2D5016' }}
        >
          Food Log History
        </h1>
        <p className="text-sm" style={{ color: '#666' }}>
          View your past food entries and receipts
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5">
        {logs.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{ 
              backgroundColor: '#fff',
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <svg 
              className="w-16 h-16 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#D3D3D3' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-base" style={{ color: '#666' }}>
              No food logs yet. Start adding items to see your history here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl p-4"
                style={{ 
                  backgroundColor: '#fff',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 
                    className="text-lg font-bold"
                    style={{ color: '#2D5016' }}
                  >
                    {formatDate(log.date)}
                  </h2>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: log.source === 'receipt' ? '#E8F5E9' : '#F0F0F0',
                      color: '#2D5016'
                    }}
                  >
                    {log.source === 'receipt' ? 'Receipt' : 'Manual'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {log.items.map((item, index) => (
                    <span
                      key={index}
                      className="text-sm px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: '#E8F5E9',
                        color: '#2D5016'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

