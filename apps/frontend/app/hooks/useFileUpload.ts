import { useState } from 'react';

export type EndpointType = 'receipt' | 'detect';

interface ReceiptItem {
  name?: string;
  item_name?: string;
  expiration_range?: string;
  price?: string;
}

interface DetectionResult {
  total_objects: number;
  processing_time_ms: number;
}

interface UseFileUploadReturn {
  selectedFile: File | null;
  endpointType: EndpointType;
  extractedItems: ReceiptItem[];
  detectionResult: DetectionResult | null;
  loading: boolean;
  error: string | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setEndpointType: (type: EndpointType) => void;
  handleUpload: () => Promise<void>;
  reset: () => void;
}

const API_BASE_URL = 'http://localhost:8000';

export function useFileUpload(): UseFileUploadReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [endpointType, setEndpointType] = useState<EndpointType>('receipt');
  const [extractedItems, setExtractedItems] = useState<ReceiptItem[]>([]);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedItems([]);
    setDetectionResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const endpoint = endpointType === 'receipt' 
      ? `${API_BASE_URL}/api/receipt/upload`
      : `${API_BASE_URL}/api/detect/objects`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (endpointType === 'receipt') {
          setExtractedItems(data.items || []);
        } else {
          setDetectionResult({
            total_objects: data.total_objects,
            processing_time_ms: data.processing_time_ms,
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        setError(errorData.detail || 'Upload failed');
      }
    } catch (error) {
      setError(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setExtractedItems([]);
    setDetectionResult(null);
    setError(null);
  };

  return {
    selectedFile,
    endpointType,
    extractedItems,
    detectionResult,
    loading,
    error,
    handleFileChange,
    setEndpointType,
    handleUpload,
    reset,
  };
}


