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
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/recipes" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Recipes
        </Link>
      </div>

      <div className="bg-[rgba(240,253,244,0.8)] backdrop-blur-lg rounded-xl border border-white/30 shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
        {recipe.estimated_minutes > 0 && (
          <p className="text-sm text-gray-500 mb-6">{recipe.estimated_minutes} minutes cook time</p>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Ingredients</h2>
          <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-700">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Instructions</h2>
          <ol className="list-decimal pl-5 mt-4 space-y-4 text-gray-700 leading-relaxed">
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
