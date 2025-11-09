import { useState, useRef } from 'react';

interface ReceiptItem {
  name?: string;
  item_name?: string;
  expiration_range?: string;
  price?: string;
}

interface UploadResponse {
  success: boolean;
  items: ReceiptItem[];
  total_items: number;
  raw_text: string;
  processing_time_ms: number;
}

interface UseReceiptUploadReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  uploadSuccess: boolean;
  uploadError: string | null;
  uploadResult: UploadResponse | null;
  handleFileSelect: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetUpload: () => void;
}

const API_BASE_URL = 'http://localhost:8000';

export function useReceiptUpload(): UseReceiptUploadReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const handleFileSelect = () => {
    // Reset previous state
    setUploadError(null);
    setUploadSuccess(false);
    setUploadResult(null);
    
    // Programmatically click the file input
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      setUploadError('No file selected');
      return;
    }

    setUploading(true);
    setUploadError(null);

    // Check if file is of valid type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
      setUploading(false);
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setUploadError('File too large. Please upload a file smaller than 10MB.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/api/receipt/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: UploadResponse = await response.json();
        setUploadResult(data);
        setUploadSuccess(true);
        
        // Refresh the ingredients list after successful upload
        window.dispatchEvent(new CustomEvent('receiptUploaded', { 
          detail: { items: data.items } 
        }));
        
        console.log(`Successfully uploaded receipt. Found ${data.total_items} items.`);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
        setUploadError(errorData.detail || 'Upload failed');
        console.error('Upload failed:', errorData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setUploadError(`Error uploading receipt: ${errorMessage}`);
      console.error('Error uploading receipt:', err);
    } finally {
      setUploading(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetUpload = () => {
    setUploadError(null);
    setUploadSuccess(false);
    setUploadResult(null);
    setUploading(false);
  };

  return {
    fileInputRef,
    uploading,
    uploadSuccess,
    uploadError,
    uploadResult,
    handleFileSelect,
    handleFileChange,
    resetUpload,
  };
}