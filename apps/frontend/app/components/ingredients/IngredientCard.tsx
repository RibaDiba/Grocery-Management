"use client";

interface IngredientCardProps {
  name: string;
  created_at: string;
  min_days: number | null;
  max_days: number | null;
}

export default function IngredientCard({ name, created_at, min_days, max_days }: IngredientCardProps) {
  // Calculate expiration dates
  const createdDate = new Date(created_at);
  const now = new Date();
  
  let expirationDate: Date | null = null;
  let daysUntilExpiration: number | null = null;
  let expirationStatus: 'expired' | 'expiring-soon' | 'fresh' = 'fresh';
  
  if (max_days !== null) {
    expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + max_days);
    daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) {
      expirationStatus = 'expired';
    } else if (daysUntilExpiration <= 3) {
      expirationStatus = 'expiring-soon';
    }
  } else if (min_days !== null) {
    // If only min_days is available, use it as a rough estimate
    expirationDate = new Date(createdDate);
    expirationDate.setDate(expirationDate.getDate() + min_days);
    daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration <= 3) {
      expirationStatus = 'expiring-soon';
    }
  }

  const getStatusColor = () => {
    switch (expirationStatus) {
      case 'expired':
        return 'border-red-300 bg-red-50';
      case 'expiring-soon':
        return 'border-yellow-300 bg-yellow-50';
      default:
        return 'border-green-200 bg-white';
    }
  };

  const getStatusText = () => {
    if (daysUntilExpiration === null) {
      return null;
    }
    if (daysUntilExpiration < 0) {
      return `Expired ${Math.abs(daysUntilExpiration)} day${Math.abs(daysUntilExpiration) === 1 ? '' : 's'} ago`;
    }
    if (daysUntilExpiration === 0) {
      return 'Expires today';
    }
    if (daysUntilExpiration === 1) {
      return 'Expires tomorrow';
    }
    return `Expires in ${daysUntilExpiration} days`;
  };

  return (
    <div 
      className="rounded-lg p-2.5 bg-white flex items-center gap-2.5"
    >
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: '#354A33' }}>
          {name}
        </p>
        {daysUntilExpiration !== null && (
          <p className="text-xs mt-0.5" style={{ color: '#354A33' }}>
            {getStatusText()}
          </p>
        )}
      </div>
      {/* Circle Icon */}
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-white"
      >
        <svg 
          className="w-3.5 h-3.5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style={{ color: '#354A33' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

