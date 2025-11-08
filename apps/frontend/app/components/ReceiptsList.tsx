"use client";

interface Receipt {
  user_id: string;
  file_path: string;
  raw_text: string;
  grocery_items: string[];
}

interface ReceiptsListProps {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  uploading: boolean;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ReceiptsList({
  receipts,
  loading,
  error,
  uploading,
  uploadError,
  fileInputRef,
  handleFileUpload,
}: ReceiptsListProps) {
export default function ReceiptsList({ userId }: { userId: string | null }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchReceipts = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token || !userId) { // Added check for userId
        setError('No access token or user ID found. Please sign in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/receipts/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch receipts');
        }

        const data = await response.json();
        
        // Log the result to console
        console.log('Receipts fetched successfully:', data);
        console.log('Number of receipts:', data.length);
        
        // Log each receipt individually
        data.forEach((receipt: Receipt, index: number) => {
          console.log(`Receipt ${index + 1}:`, {
            user_id: receipt.user_id,
            file_path: receipt.file_path,
            raw_text: receipt.raw_text,
            grocery_items: receipt.grocery_items,
            grocery_items_count: receipt.grocery_items.length,
          });
        });

        setReceipts(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
        console.error('Error fetching receipts:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [userId]); // Added userId to dependency array

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUploadError('No access token found. Please sign in again.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/receipt/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload receipt');
      }

      const data: UploadResponse = await response.json();
      
      // Log the API response to console
      console.log('Receipt upload successful:', data);
      console.log('Upload response details:', {
        success: data.success,
        total_items: data.total_items,
        items: data.items,
        raw_text: data.raw_text,
        processing_time_ms: data.processing_time_ms,
      });
      
      // Log each extracted item
      if (data.items && data.items.length > 0) {
        console.log('Extracted grocery items:');
        data.items.forEach((item, index) => {
          console.log(`  Item ${index + 1}:`, item);
        });
      }

      // Refresh the receipts list
      const receiptsResponse = await fetch('http://localhost:8000/api/receipts/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (receiptsResponse.ok) {
        const receiptsData = await receiptsResponse.json();
        setReceipts(receiptsData);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error or server is unreachable.';
      console.error('Error uploading receipt:', err);
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 w-full">
        <p className="text-gray-700">Loading receipts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 w-full">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-green-800">
          Receipts ({receipts.length})
        </h2>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
        <label className="block mb-2 text-sm font-medium text-green-800">
          Upload Receipt
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-800
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-600 file:text-white
            hover:file:bg-green-700
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploading && (
          <p className="mt-2 text-sm text-gray-600">
            Uploading and processing receipt...
          </p>
        )}
        {uploadError && (
          <p className="mt-2 text-sm text-red-500">
            {uploadError}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-600">
          Supported formats: JPG, PNG, PDF (Max 10MB)
        </p>
      </div>
  
    </div>
  );
}

