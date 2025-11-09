"use client";

export default function RecipesList() {
  // Placeholder recipe data
  const recipes = [
    { id: 1, name: "Pasta Primavera", image: null },
    { id: 2, name: "Chicken Stir Fry", image: null },
    { id: 3, name: "Vegetable Soup", image: null },
  ];

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
          {/* Arrow Icon */}
          <svg 
            className="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#354A33' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

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
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#354A33' }}>
                  {recipe.name}
                </p>
              </div>
              <button className="text-xs font-medium" style={{ color: '#354A33' }}>
                See more
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

