"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';

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

  const handleDelete = async (recipeId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setError("You must be logged in to delete recipes.");
      return;
    }

    if (!confirm("Are you sure you want to delete this recipe?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to delete recipe (${res.status})`);
      }

      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete recipe';
      setError(msg);
    }
  };

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
          source: 'ai_generated',
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
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#354A33' }}>Recipes</h1>
          <p className="text-sm text-gray-600 mt-1">Just for you.</p>
        </div>
        <div className="flex items-center gap-2">
          {genError && (
            <span className="text-xs text-red-600">{genError}</span>
          )}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-sm font-medium rounded-md px-4 py-2 bg-white border hover:bg-black/5 disabled:opacity-50"
            style={{ color: '#354A33', borderColor: '#354A33' }}
          >
            {generating ? 'Generating…' : 'Generate recipe'}
          </button>
        </div>
      </div>

      {/* Status */}
      {loading && (
        <div className="text-sm text-gray-600 py-4">Loading recipes…</div>
      )}
      {error && (
        <div className="text-sm text-red-600 py-4">{error}</div>
      )}

      {/* Recipe Cards */}
      <div className="space-y-3">
        {recipes.map((recipe) => (
          <Link href={`/recipes/${recipe.id}`} key={recipe.id} className="block">
            <div
              className="rounded-lg bg-white border border-gray-200 p-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {recipe.title}
                </p>
                {recipe.estimated_minutes ? (
                  <p className="text-sm text-gray-500">{recipe.estimated_minutes} min{recipe.estimated_minutes !== 1 ? 's' : ''}</p>
                ) : null}
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(recipe.id);
                }}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full transition-colors"
                aria-label="Delete recipe"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </Link>
        ))}
        {!loading && !error && recipes.length === 0 && (
          <div className="rounded-lg bg-white border border-gray-200 p-6 text-center text-gray-600">
            <p className="font-medium">No recipes yet.</p>
            <p className="text-sm">Click &apos;Generate recipe&apos; to get started!</p>
          </div>
        )}
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

