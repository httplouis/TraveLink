"use client";

import * as React from "react";
import { Upload, X, FileText, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";
import type { Attachment } from "@/lib/admin/maintenance/maintenance.types";

type Props = {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  errors?: Record<string, string>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export default function FileAttachmentSection({
  attachments,
  onChange,
  errors,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const [uploading, setUploading] = React.useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string>>({});

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check file count limit
    if (attachments.length + fileArray.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed. Please remove some files first.`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of fileArray) {
      // Check file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert(`${file.name}: Only PDF, JPG, and PNG files are allowed.`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}: File size must be less than 10MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Upload each file
    for (const file of validFiles) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setUploading(prev => ({ ...prev, [tempId]: true }));
      setUploadErrors(prev => ({ ...prev, [tempId]: "" }));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload/request-attachment", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Upload failed";
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorMessage;
          } catch {
            errorMessage = errorText || `Server error: ${response.status}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result.ok && result.attachment) {
          onChange([...attachments, result.attachment]);
        } else {
          throw new Error(result.error || "Upload failed");
        }
      } catch (err: any) {
        console.error("[FileAttachment] Upload error:", err);
        setUploadErrors(prev => ({
          ...prev,
          [tempId]: err.message || "Upload failed",
        }));
      } finally {
        setUploading(prev => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ""; // Reset input
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    onChange(attachments.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mime: string) => {
    if (mime === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <ImageIcon className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900">
          Supporting Documents (Optional)
        </label>
        <span className="text-xs text-gray-500">
          {attachments.length}/{MAX_FILES} files
        </span>
      </div>
      
      <p className="text-xs text-gray-600">
        Attach invitation letters, program schedules, or other supporting documents.
        Accepted formats: PDF, JPG, PNG (max 10MB per file, {MAX_FILES} files max)
      </p>

      {/* File Upload Area */}
      {attachments.length < MAX_FILES && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors
            ${dragActive 
              ? "border-[#7a0010] bg-[#7a0010]/5" 
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PDF, JPG, PNG (max 10MB per file)
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 text-sm font-medium text-[#7a0010] bg-white border border-[#7a0010] rounded-lg hover:bg-[#7a0010]/5 transition-colors"
            >
              Select Files
            </button>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {Object.keys(uploading).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Uploading files...</p>
          {Object.keys(uploading).map((tempId) => (
            <div
              key={tempId}
              className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
                {uploadErrors[tempId] && (
                  <p className="text-xs text-red-600">{uploadErrors[tempId]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Attached Files:</p>
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(att.mime)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {att.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(att.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View file"
                    >
                      <FileText className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors?.attachments && (
        <p className="text-xs text-red-600">{errors.attachments}</p>
      )}
    </div>
  );
}

