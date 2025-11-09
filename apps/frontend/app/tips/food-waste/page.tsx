"use client";

import { useRouter } from 'next/navigation';

export default function FoodWasteInfoPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Understanding Food Waste",
      content: "Food waste is a significant global issue. Approximately one-third of all food produced for human consumption is wasted each year. This not only wastes resources but also contributes to environmental problems."
    },
    {
      title: "Why Food Waste Matters",
      content: "Food waste in landfills produces methane, a potent greenhouse gas. Reducing food waste helps combat climate change, saves money, and ensures food security for more people."
    },
    {
      title: "How to Reduce Food Waste",
      content: "Plan meals carefully, buy only what you need, store food properly, use leftovers creatively, and compost food scraps when possible."
    },
    {
      title: "Storage Tips",
      content: "Store fruits and vegetables properly - some need refrigeration, others don't. Keep your fridge organized so you can see what you have. Use airtight containers to keep food fresh longer."
    },
    {
      title: "First In, First Out (FIFO)",
      content: "When putting groceries away, move older items to the front and place new items in the back. This ensures you use older food before it spoils."
    },
    {
      title: "Understanding Expiration Dates",
      content: "'Best by' dates are about quality, not safety. 'Use by' dates are more important for safety. Trust your senses - if food looks, smells, and tastes fine, it's likely safe to eat."
    },
    {
      title: "Creative Uses for Leftovers",
      content: "Transform leftovers into new meals. Turn yesterday's vegetables into a soup, use stale bread for croutons, and repurpose cooked grains into salads or stir-fries."
    },
    {
      title: "Composting",
      content: "Compost food scraps instead of throwing them away. Composting reduces waste and creates nutrient-rich soil for your garden."
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
          Food Waste Management
        </h1>
        <p className="text-sm" style={{ color: '#666' }}>
          Learn how to reduce food waste and help the environment
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pb-5">
        <div className="space-y-4">
          {sections.map((section, index) => (
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
                {section.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#000' }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

