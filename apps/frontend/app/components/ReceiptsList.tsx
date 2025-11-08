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
  if (loading) {
    return (
      <div className="mt-8 w-full">
        <p className="text-black dark:text-zinc-50">Loading receipts...</p>
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
        <h2 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Receipts ({receipts.length})
        </h2>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900">
        <label className="block mb-2 text-sm font-medium text-black dark:text-zinc-50">
          Upload Receipt
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-black dark:text-zinc-50
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-green-500 file:text-white
            hover:file:bg-green-600
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {uploading && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Uploading and processing receipt...
          </p>
        )}
        {uploadError && (
          <p className="mt-2 text-sm text-red-500">
            {uploadError}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Supported formats: JPG, PNG, PDF (Max 10MB)
        </p>
      </div>
      {receipts.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">No receipts found.</p>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt, index) => (
            <div
              key={index}
              className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900"
            >
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                File: {receipt.file_path}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                Grocery Items: {receipt.grocery_items.length}
              </p>
              {receipt.grocery_items.length > 0 && (
                <ul className="list-disc list-inside text-sm text-black dark:text-zinc-50">
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

