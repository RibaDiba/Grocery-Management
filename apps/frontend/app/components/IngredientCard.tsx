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
    <div className={`rounded-lg p-4 shadow-sm border ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-base font-medium text-gray-800">
            {name}
          </p>
          {daysUntilExpiration !== null && (
            <p className={`text-xs mt-1 ${
              expirationStatus === 'expired' ? 'text-red-600' :
              expirationStatus === 'expiring-soon' ? 'text-yellow-700' :
              'text-gray-600'
            }`}>
              {getStatusText()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

