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
  // File upload is handled by parent component

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
      {receipts.length === 0 ? (
        <p className="text-gray-600">No receipts found.</p>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt, index) => (
            <div
              key={index}
              className="rounded-lg bg-white p-4 shadow-sm border border-green-100"
            >
              <p className="text-sm text-gray-600 mb-2">
                File: {receipt.file_path}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Grocery Items: {receipt.grocery_items.length}
              </p>
              {receipt.grocery_items.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-800">
                  {receipt.grocery_items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

