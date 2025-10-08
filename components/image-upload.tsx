"use client";

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImages = useCallback(async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('pesu_auth_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.success && result.data?.urls) {
        const newImages = [...images, ...result.data.urls].slice(0, maxImages);
        onImagesChange(newImages);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [images, onImagesChange, maxImages]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      uploadImages(files);
    }
  }, [uploadImages]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    uploadImages(files);
  }, [uploadImages]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
          disabled={uploading || images.length >= maxImages}
        />
        <label
          htmlFor="image-upload"
          className={`cursor-pointer block ${uploading || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, WEBP up to 10MB ({images.length}/{maxImages})
          </p>
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;