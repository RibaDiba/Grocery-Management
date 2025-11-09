"use client";

import { useEffect, useState } from "react";

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  estimated_minutes: number;
  source?: string | null;
  created_at?: string;
};

export default function RecipesList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    ingredients_used: string[];
    steps: string[];
    estimated_minutes: number;
  } | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
          // Not signed in; show empty quietly
          setRecipes([]);
          return;
        }
        const res = await fetch("http://localhost:8000/api/recipes/", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Failed to load recipes (${res.status})`);
        }
        const data = (await res.json()) as Recipe[];
        if (!cancelled) setRecipes(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled && !(e instanceof DOMException && e.name === 'AbortError')) {
          const msg = e instanceof Error ? e.message : 'Failed to load recipes';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:8000/api/groceries/recipe', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to generate recipe (${res.status})`);
      }
      const data = await res.json();
      setPreview({
        title: data.title || 'Quick Recipe',
        ingredients_used: Array.isArray(data.ingredients_used) ? data.ingredients_used : [],
        steps: Array.isArray(data.steps) ? data.steps : [],
        estimated_minutes: Number(data.estimated_minutes) || 20,
      });
      setPreviewOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate recipe';
      setGenError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePreview = async () => {
    if (!preview) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:8000/api/recipes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: preview.title,
          ingredients: preview.ingredients_used,
          steps: preview.steps,
          estimated_minutes: preview.estimated_minutes,
          source: 'generated',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to save recipe (${res.status})`);
      }
      const saved = (await res.json()) as Recipe;
      setRecipes((prev) => [saved, ...prev]);
      setPreviewOpen(false);
      setPreview(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save recipe';
      setGenError(msg);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setGenError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('http://localhost:8000/api/groceries/recipe', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to regenerate recipe (${res.status})`);
      }
      const data = await res.json();
      setPreview({
        title: data.title || 'Quick Recipe',
        ingredients_used: Array.isArray(data.ingredients_used) ? data.ingredients_used : [],
        steps: Array.isArray(data.steps) ? data.steps : [],
        estimated_minutes: Number(data.estimated_minutes) || 20,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to regenerate recipe';
      setGenError(msg);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      <div 
        className="rounded-lg p-2.5"
        style={{
          backgroundColor: '#E8F5E9',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2 bg-transparent">
          <div className="flex items-center gap-2">
            {/* Book Icon */}
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: '#354A33' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>
              Recipes, just for you
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {genError && (
              <span className="text-xs text-red-600">{genError}</span>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs font-medium rounded-md px-3 py-1.5 bg-white hover:bg-black/5 disabled:opacity-50"
              style={{ color: '#354A33', border: '1px solid #e5e7eb' }}
            >
              {generating ? 'Generating…' : 'Generate recipe'}
            </button>
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="text-sm text-gray-600 px-1 py-1">Loading recipes…</div>
        )}
        {error && (
          <div className="text-sm text-red-600 px-1 py-1">{error}</div>
        )}

        {/* Recipe Cards */}
        <div className="space-y-1.5">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-lg bg-white p-2 flex items-center gap-2"
            >
              {/* Image Placeholder */}
              <div 
                className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: '#E5E7EB' }}
              >
                <svg 
                  className="w-7 h-7" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: '#9CA3AF' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#354A33' }}>
                  {recipe.title}
                </p>
                {recipe.estimated_minutes ? (
                  <p className="text-xs text-gray-500">{recipe.estimated_minutes} min{recipe.estimated_minutes !== 1 ? 's' : ''}</p>
                ) : null}
              </div>
              <button className="text-xs font-medium" style={{ color: '#354A33' }}>
                See more
              </button>
            </div>
          ))}
          {!loading && !error && recipes.length === 0 && (
            <div className="rounded-lg bg-white p-3 text-sm text-gray-600">
              No recipes yet. Generate one or add manually!
            </div>
          )}
        </div>
      </div>

      {previewOpen && preview && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: '#354A33' }}>{preview.title}</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-sm px-3 py-1 rounded-md bg-black/5 hover:bg-black/10"
              >Close</button>
            </div>
            {preview.estimated_minutes ? (
              <p className="text-xs text-gray-600 mb-3">~{preview.estimated_minutes} min</p>
            ) : null}
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#354A33' }}>Ingredients</p>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-0.5">
                {preview.ingredients_used.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: '#354A33' }}>Steps</p>
              <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-1">
                {preview.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 hover:bg-black/5 disabled:opacity-50"
              >
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 hover:bg-black/5"
              >Cancel</button>
              <button
                onClick={handleSavePreview}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white"
                style={{ backgroundColor: '#354A33' }}
              >Save to recipes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

