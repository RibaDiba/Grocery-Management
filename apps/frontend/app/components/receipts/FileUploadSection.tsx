import { type EndpointType } from '../hooks/useFileUpload';

interface FileUploadSectionProps {
  selectedFile: File | null;
  endpointType: EndpointType;
  loading: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEndpointChange: (type: EndpointType) => void;
  onUpload: () => void;
}

export default function FileUploadSection({
  selectedFile,
  endpointType,
  loading,
  onFileChange,
  onEndpointChange,
  onUpload,
}: FileUploadSectionProps) {
  return (
    <div className="mt-8 w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-black dark:text-zinc-50">
          Select Endpoint Type:
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="receipt"
              checked={endpointType === 'receipt'}
              onChange={(e) => onEndpointChange(e.target.value as EndpointType)}
              className="w-4 h-4"
            />
            <span className="text-black dark:text-zinc-50">Receipt Parser</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="detect"
              checked={endpointType === 'detect'}
              onChange={(e) => onEndpointChange(e.target.value as EndpointType)}
              className="w-4 h-4"
            />
            <span className="text-black dark:text-zinc-50">YOLO Detection</span>
          </label>
        </div>
      </div>
      <div className="flex gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="flex-grow rounded-full border border-solid border-black/[.08] px-5 py-3 text-black transition-colors focus:border-transparent focus:bg-black/[.04] dark:border-white/[.145] dark:bg-black dark:text-white dark:focus:bg-[#1a1a1a]"
        />
        <button
          onClick={onUpload}
          disabled={loading || !selectedFile}
          className="rounded-full bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : endpointType === 'receipt' ? 'Upload Receipt' : 'Detect Objects'}
        </button>
      </div>
      {selectedFile && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Selected: {selectedFile.name}
        </p>
      )}
    </div>
  );
}


