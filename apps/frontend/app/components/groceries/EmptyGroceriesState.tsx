"use client";

import { ShoppingCart, Plus, Camera, FileText } from 'lucide-react';

const COLORS = {
  primary: '#354A33',
  light: '#CBDFC9',
  medium: '#95C590',
  secondary: '#4A614F',
};

interface EmptyGroceriesStateProps {
  onAddManually?: () => void;
  onUploadReceipt?: () => void;
}

export default function EmptyGroceriesState({ 
  onAddManually, 
  onUploadReceipt 
}: EmptyGroceriesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Icon */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{ backgroundColor: `${COLORS.light}80` }}
      >
        <ShoppingCart className="w-8 h-8" color={COLORS.primary} />
      </div>

      {/* Main Message */}
      <h3 
        className="text-lg font-semibold text-center mb-2"
        style={{ color: COLORS.primary }}
      >
        No groceries yet
      </h3>
      
      <p 
        className="text-sm text-center mb-8 max-w-sm leading-relaxed"
        style={{ color: COLORS.secondary }}
      >
        Start building your grocery list by adding items manually or uploading a receipt photo
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onAddManually}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Manually</span>
        </button>
        
        <button
          onClick={onUploadReceipt}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border-2 transition-all duration-200 hover:scale-105 active:scale-95 flex-1"
          style={{ 
            borderColor: COLORS.primary,
            color: COLORS.primary,
            backgroundColor: 'white'
          }}
        >
          <Camera className="w-4 h-4" />
          <span>Upload Receipt</span>
        </button>
      </div>

      {/* Tips Section */}
      <div className="mt-8 p-4 rounded-lg w-full max-w-sm" style={{ backgroundColor: `${COLORS.light}40` }}>
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" color={COLORS.secondary} />
          <div>
            <h4 className="text-xs font-medium mb-1" style={{ color: COLORS.primary }}>
              Pro Tips:
            </h4>
            <ul className="text-xs space-y-1" style={{ color: COLORS.secondary }}>
              <li>• Upload receipt photos for quick entry</li>
              <li>• Track expiration dates automatically</li>
              <li>• Get recipe suggestions based on your items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}