export default function SuccessPopup({ 
  message, 
  subMessage, 
  onClose 
}: { 
  message: string; 
  subMessage?: string; 
  onClose?: () => void;
}) {
  // Inject animation styles into the document head
  if (typeof document !== 'undefined' && !document.getElementById('success-popup-styles')) {
    const style = document.createElement('style');
    style.id = 'success-popup-styles';
    style.innerHTML = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(20px); }
      }
    `;
    document.head.appendChild(style);
  }

  return (
    <div 
      className="fixed bottom-24 left-4 right-4 rounded-xl p-4 z-20 shadow-xl" 
      style={{ 
        backgroundColor: '#E8F5E9',
        border: '1px solid #A5D6A7',
        color: '#22543d',
        animation: 'fadeInOut 4s ease-in-out forwards'
      }}
    >
      
      <div className="flex items-start">
        {/* Icon and content */}
        <div className="flex-1 flex items-start gap-3">
          {/* Success checkmark in circle */}
          <div 
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ 
              backgroundColor: '#4CAF50',
              width: '28px',
              height: '28px'
            }}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="white" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          
          {/* Message content */}
          <div className="flex-1">
            <p className="font-medium text-base text-gray-800">{message}</p>
            {subMessage && (
              <p className="text-sm mt-1 text-gray-600">{subMessage}</p>
            )}
          </div>
        </div>
        
        {/* Close button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 ml-2 hover:text-gray-600 flex-shrink-0"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}