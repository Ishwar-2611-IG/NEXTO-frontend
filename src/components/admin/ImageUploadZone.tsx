import React, { useRef, useState } from 'react';
import { api } from '../../services/api';

export interface ImageUploadItem {
  url: string;
  alt?: string;
  publicId?: string;
}

export interface ImageUploadZoneProps {
  multiple?: boolean;
  accept?: string;
  folder?: 'products' | 'banners';
  maxFiles?: number;
  maxSizeMb?: number;
  onUpload: (images: ImageUploadItem[]) => void;
  onError?: (message: string) => void;
  existingImages?: ImageUploadItem[];
  onRemove?: (index: number) => void;
  className?: string;
}

interface UploadProgressItem {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface UploadResponse {
  url: string;
  publicId: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  multiple = false,
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  folder = 'products',
  maxFiles,
  maxSizeMb = 5,
  onUpload,
  onError,
  existingImages = [],
  onRemove,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState<UploadProgressItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return `"${file.name}" is not a valid image file.`;
    }
    if (file.size > maxSizeBytes) {
      return `"${file.name}" exceeds the maximum size of ${maxSizeMb}MB.`;
    }
    return null;
  };

  const handleFiles = async (files: FileList | File[]) => {
    setGlobalError(null);
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    if (!multiple && fileList.length > 1) {
      setGlobalError('Only single file upload is permitted.');
      return;
    }
    if (maxFiles !== undefined && fileList.length > maxFiles) {
      const message = `Select no more than ${maxFiles} image${maxFiles === 1 ? '' : 's'}.`;
      setGlobalError(message);
      onError?.(message);
      return;
    }

    const validFiles: File[] = [];
    for (const file of fileList) {
      const error = validateFile(file);
      if (error) {
        setGlobalError(error);
        return;
      }
      validFiles.push(file);
    }

    const uploadItems: UploadProgressItem[] = validFiles.map((file, i) => ({
      id: `${file.name}-${Date.now()}-${i}`,
      fileName: file.name,
      progress: 10,
      status: 'uploading',
    }));

    setActiveUploads((prev) => [...prev, ...uploadItems]);

    const uploadedImages: Array<ImageUploadItem | undefined> = new Array(validFiles.length);

    await Promise.all(
      validFiles.map(async (file, index) => {
        const itemId = uploadItems[index].id;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', folder);

        try {
          // Simulate progress tick
          setActiveUploads((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, progress: 40 } : item))
          );

          const response = await api.post<UploadResponse>('/admin/upload', formData);

          if (response?.url && response.publicId) {
            uploadedImages[index] = { url: response.url, publicId: response.publicId };
            setActiveUploads((prev) =>
              prev.map((item) =>
                item.id === itemId ? { ...item, progress: 100, status: 'success' } : item
              )
            );
          } else {
            throw new Error('Upload succeeded but no image URL was returned.');
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Upload failed. Please check network and try again.';
          onError?.(message);
          setActiveUploads((prev) =>
            prev.map((item) =>
              item.id === itemId
                ? { ...item, status: 'error', errorMessage: message, progress: 100 }
                : item
            )
          );
        }
      })
    );

    const successfulImages = uploadedImages.filter((image): image is ImageUploadItem => Boolean(image));
    if (successfulImages.length > 0) {
      onUpload(successfulImages);
    }

    // Clean up finished successful indicators after 3 seconds
    setTimeout(() => {
      setActiveUploads((prev) => prev.filter((item) => item.status !== 'success'));
    }, 3000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void handleFiles(e.target.files);
    }
    // reset input value so re-uploading same file works
    e.target.value = '';
  };

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
          isDragging
            ? 'border-[#1F3A2E] bg-[#E8EDE9]'
            : 'border-[#E5E4DF] bg-white hover:border-[#1F3A2E]/50 hover:bg-[#FAF9F6]'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload image dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="w-12 h-12 mb-3 rounded-full bg-[#FAF9F6] border border-[#E5E4DF] flex items-center justify-center text-[#1F3A2E] group-hover:scale-105 transition-transform">
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <p className="text-sm font-medium text-[#1A1A1A]">
          <span className="font-semibold text-[#1F3A2E] underline">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-[#6B6B65]">
          PNG, JPG, WEBP, AVIF up to {maxSizeMb}MB {multiple ? '(multiple files supported)' : ''}
        </p>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <span>{globalError}</span>
          <button
            type="button"
            onClick={() => setGlobalError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Progress List */}
      {activeUploads.length > 0 && (
        <div className="space-y-2">
          {activeUploads.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white border border-[#E5E4DF] rounded-lg text-xs space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between font-medium">
                <span className="truncate max-w-[200px] text-[#1A1A1A]">{item.fileName}</span>
                <span
                  className={
                    item.status === 'error'
                      ? 'text-red-600'
                      : item.status === 'success'
                      ? 'text-emerald-600'
                      : 'text-[#1F3A2E]'
                  }
                >
                  {item.status === 'uploading'
                    ? 'Uploading...'
                    : item.status === 'success'
                    ? 'Uploaded'
                    : 'Failed'}
                </span>
              </div>

              {item.status === 'uploading' && (
                <div className="w-full bg-[#E5E4DF] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1F3A2E] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'error' && item.errorMessage && (
                <p className="text-red-600">{item.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing / Uploaded Images Thumbnails */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {existingImages.map((img, idx) => (
            <div
              key={`${img.url}-${idx}`}
              className="group relative aspect-square rounded-lg border border-[#E5E4DF] overflow-hidden bg-[#FAF9F6]"
            >
              <img
                src={img.url}
                alt={img.alt || `Product image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors focus:outline-none"
                  aria-label={`Remove image ${idx + 1}`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
