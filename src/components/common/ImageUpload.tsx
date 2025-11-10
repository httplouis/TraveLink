'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<{ url: string; error?: string }>;
  currentImageUrl?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

/**
 * Reusable Image Upload Component
 * Can be used for profiles, signatures, maintenance photos, etc.
 */
export default function ImageUpload({
  onUpload,
  currentImageUrl,
  label = 'Upload Image',
  accept = 'image/*',
  maxSizeMB = 5,
  className = '',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload
    setUploading(true);
    try {
      const result = await onUpload(file);
      
      if (result.error) {
        setError(result.error);
        setPreview(currentImageUrl || '');
      } else {
        setPreview(result.url);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      setPreview(currentImageUrl || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {/* Preview Area */}
        {preview ? (
          <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
            
            {/* Remove button */}
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Upload overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Button
          <button
            onClick={handleClick}
            disabled={uploading}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 bg-white rounded-full border border-gray-200">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {uploading ? 'Uploading...' : 'Click to upload'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept === 'image/*' ? 'PNG, JPG, GIF' : accept} (max {maxSizeMB}MB)
              </p>
            </div>
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && !preview && (
        <p className="text-xs text-gray-500">
          Recommended: Square image, at least 400x400px
        </p>
      )}
    </div>
  );
}
