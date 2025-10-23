"use client";
import * as React from "react";
import type { Attachment } from "@/lib/admin/maintenance";

type Props = {
  open: boolean;
  files: Attachment[];
  index: number;
  onClose: () => void;
};

export default function AttachmentLightbox({ open, files, index, onClose }: Props) {
  const [i, setI] = React.useState(index);
  React.useEffect(() => setI(index), [index, open]);

  if (!open) return null;
  const file = files[i];

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center">
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] h-[85vh] p-4">
        <button
          className="absolute top-3 right-3 px-3 py-1 rounded bg-gray-900 text-white"
          onClick={onClose}
        >
          Close
        </button>

        <div className="flex items-center gap-3 absolute left-3 top-3">
          <button
            onClick={() => setI((v) => Math.max(0, v - 1))}
            className="px-2 py-1 rounded border"
          >
            ←
          </button>
          <button
            onClick={() => setI((v) => Math.min(files.length - 1, v + 1))}
            className="px-2 py-1 rounded border"
          >
            →
          </button>
          <span className="text-sm text-gray-600">
            {i + 1} / {files.length} • {file?.name}
          </span>
          <a
            href={file?.url}
            target="_blank"
            className="text-sm underline text-blue-600"
          >
            Open original
          </a>
        </div>

        <div className="h-full w-full grid place-items-center">
          {file?.mime.startsWith("image/") ? (
            <img src={file.url} alt={file.name} className="max-h-full max-w-full" />
          ) : (
            <iframe src={file.url} className="w-full h-full rounded" />
          )}
        </div>
      </div>
    </div>
  );
}
