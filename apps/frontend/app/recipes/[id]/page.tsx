"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  steps: string[];
  estimated_minutes: number;
};

export default function RecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/signin');
          return;
        }
        const res = await fetch(`http://localhost:8000/api/recipes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Failed to load recipe (${res.status})`);
        }
        const data = await res.json();
        setRecipe(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load recipe';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, router]);

  if (loading) {
    return (
      <div className="w-full px-4 py-8 text-center">
        <p>Loading recipe...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-8 text-center text-red-600">
        <p>{error}</p>
        <Link href="/recipes" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Recipes
        </Link>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="w-full px-4 py-8 text-center">
        <p>Recipe not found.</p>
        <Link href="/recipes" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Recipes
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #CBDFC9 32%, #95C590 100%)' }}>
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 bg-white border text-sm font-medium hover:bg-black/5"
            style={{ color: '#354A33', borderColor: '#354A33' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Recipes
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#354A33' }}>{recipe.title}</h1>
        {recipe.estimated_minutes > 0 && (
          <p className="text-xs mb-4" style={{ color: 'rgba(31,42,28,0.75)' }}>~{recipe.estimated_minutes} minutes</p>
        )}

        <section 
          className="mt-4 mb-4 rounded-lg p-3"
          style={{ backgroundColor: '#E8F5E9', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>Ingredients</h2>
          </div>
          <ul className="list-disc pl-5 text-sm space-y-2" style={{ color: '#1F2A1C' }}>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </section>

        <section 
          className="mt-2 mb-6 rounded-lg p-3"
          style={{ backgroundColor: '#E8F5E9', boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold" style={{ color: '#354A33' }}>Instructions</h2>
          </div>
          <ol className="list-decimal pl-5 space-y-3 text-sm leading-relaxed" style={{ color: '#1F2A1C' }}>
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
