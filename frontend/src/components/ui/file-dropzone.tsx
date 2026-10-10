'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { UPLOAD } from '@/lib/constants';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onClear: () => void;
  selectedFile: File | null;
  error?: string | null;
  label?: string;
  description?: string;
  className?: string;
  accept?: string;
}

export function FileDropzone({
  onFileSelect,
  onClear,
  selectedFile,
  error,
  label,
  description,
  className,
  accept = UPLOAD.ACCEPTED_MIME_TYPES.join(','),
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateAndSelect = (file: File) => {
    if (file.size > UPLOAD.MAX_FILE_SIZE_BYTES) {
      alert(`File size must be less than ${formatFileSize(UPLOAD.MAX_FILE_SIZE_BYTES)}`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}

      {!selectedFile ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer',
            isDragging
              ? 'border-brand-orange bg-brand-orange/5'
              : error
                ? 'border-danger bg-danger/5'
                : 'border-cn-border hover:border-text-muted hover:bg-surface/50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <UploadCloud className={cn("w-8 h-8 mb-3", isDragging ? 'text-brand-orange' : 'text-text-muted')} />
          <p className="text-sm font-medium text-text-primary mb-1">
            Drag & drop an image here
          </p>
          <p className="text-xs text-text-muted mb-4">
            or click to browse from your device
          </p>
          
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          
          <button
            type="button"
            className="px-4 py-2 bg-elevated border border-cn-border rounded-md text-sm hover:bg-surface transition-colors"
          >
            Select File
          </button>
        </div>
      ) : (
        <div className="border border-cn-border rounded-lg p-4 bg-surface flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0 mr-4">
            <div className="w-10 h-10 shrink-0 bg-elevated rounded-md flex items-center justify-center mr-3">
              <ImageIcon className="w-5 h-5 text-text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-muted">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors shrink-0"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {description && !error && (
        <p className="mt-2 text-xs text-text-muted">{description}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
