"use client";

import RecipesList from "../components/recipes/RecipesList";

export default function RecipesPage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #CBDFC9 32%, #95C590 100%)' }}>
      <div className="w-full max-w-3xl mx-auto px-4 py-6">
        <RecipesList />
      </div>
    </main>
  );
}
