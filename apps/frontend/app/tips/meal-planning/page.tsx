"use client";

import { useRouter } from 'next/navigation';

export default function MealPlanningTipsPage() {
  const router = useRouter();

  const tips = [
    {
      title: "Plan Your Meals Weekly",
      description: "Set aside time each week to plan your meals. This helps you buy only what you need and reduces food waste."
    },
    {
      title: "Check Your Pantry First",
      description: "Before shopping, check what you already have. Plan meals around ingredients you already own to save money and reduce waste."
    },
    {
      title: "Create a Shopping List",
      description: "Write down exactly what you need before going to the store. Stick to your list to avoid impulse purchases."
    },
    {
      title: "Batch Cooking",
      description: "Cook larger portions and store leftovers. This saves time during the week and ensures you use all your ingredients."
    },
    {
      title: "Use Seasonal Ingredients",
      description: "Seasonal produce is fresher, cheaper, and more flavorful. Plan meals around what's in season."
    },
    {
      title: "Prep Ingredients in Advance",
      description: "Wash, chop, and prepare vegetables when you get home from shopping. This makes cooking during the week much faster."
    },
    {
      title: "Leftover Strategy",
      description: "Plan for leftovers by cooking extra portions. Designate one night a week as 'leftover night' to clear out the fridge."
    },
    {
      title: "Flexible Meal Plans",
      description: "Keep your meal plan flexible. If plans change, have backup options that use the same ingredients."
    }
  ];

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
          Tips for Meal Planning
        </h1>
        <p className="text-sm" style={{ color: '#666' }}>
          Make meal planning easier and reduce food waste
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5">
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="rounded-xl p-4"
              style={{ 
                backgroundColor: '#fff',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: '#2D5016' }}
              >
                {tip.title}
              </h2>
              <p className="text-sm" style={{ color: '#000' }}>
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

