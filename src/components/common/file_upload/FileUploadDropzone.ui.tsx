"use client";
import * as React from "react";

export function FileUploadDropzone({
  label = "Upload",
  helper = "Choose a file or drag and drop",
  accept = "*/*",
  multiple = false,
  accent = "#7a0019",
  onFiles,
}: {
  label?: string;
  helper?: string;
  accept?: string;
  multiple?: boolean;
  accent?: string;             // maroon
  onFiles: (files: FileList | File[]) => void;
}) {
  const [dragOver, setDragOver] = React.useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-900">{label}</div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`mt-3 flex h-44 items-center justify-center rounded-xl border-2 border-dashed transition`}
        style={{
          borderColor: dragOver ? accent : "#d1d5db",
          backgroundColor: dragOver ? "#f8f0f2" : "white",
        }}
      >
        <div className="text-center">
          <div className="mb-1 text-sm text-gray-600">{helper}</div>
          <label
            className="inline-flex cursor-pointer items-center justify-center rounded-md px-3 py-1.5 text-white"
            style={{ background: accent }}
          >
            Browse file
            <input
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => {
                if (e.target.files?.length) onFiles(e.target.files);
                e.currentTarget.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
