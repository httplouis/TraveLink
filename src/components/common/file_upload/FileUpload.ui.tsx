"use client";
import * as React from "react";
import { FileUploadDropzone } from "./FileUploadDropzone.ui";
import { UploadList, UploadItem } from "./UploadList.ui";

export function FileUpload({
  label = "Upload files",
  helper = "Choose a file or drag and drop",
  accept = "*/*",
  multiple = false,
  maxSizeMB = 50,
  accent = "#7a0019",      // maroon
  autoStart = true,
  preview,                  // backward compat (single)
  onChange,                 // single
  onChangeMany,             // multiple
  simulateErrors = false,   // demo only
}: {
  label?: string;
  helper?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  accent?: string;
  autoStart?: boolean;
  preview?: string;
  onChange?: (file: File | null, url?: string) => void;
  onChangeMany?: (items: UploadItem[]) => void;
  simulateErrors?: boolean;
}) {
  const [items, setItems] = React.useState<UploadItem[]>([]);
  const timers = React.useRef<Record<string, number>>({});

  // support initial preview for single image
  React.useEffect(() => {
    if (!multiple && preview && items.length === 0) {
      setItems([{
        id: "preview",
        file: new File([], "preview"),
        name: "preview",
        size: 0,
        url: preview,
        progress: 100,
        status: "done",
      } as UploadItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, multiple]);

  // notify parent
  React.useEffect(() => {
    if (multiple) onChangeMany?.(items);
    else {
      const firstDone = items.find(i => i.status === "done" && i.url);
      onChange?.(firstDone?.file ?? null, firstDone?.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const clearTimer = (id: string) => {
    const t = timers.current[id];
    if (t) { window.clearInterval(t); delete timers.current[id]; }
  };

  const startUpload = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "uploading", progress: 0, error: undefined } : i));
    const t = window.setInterval(() => {
      setItems(prev => {
        const cur = prev.find(i => i.id === id);
        if (!cur) { clearTimer(id); return prev; }
        const next = Math.min(100, cur.progress + Math.floor(10 + Math.random() * 18));
        const fail = simulateErrors && Math.random() < 0.2;
        if (next >= 100) {
          clearTimer(id);
          return prev.map(i => i.id === id ? {
            ...i,
            progress: 100,
            status: fail ? "error" : "done",
            error: fail ? "Network error. Please retry." : undefined,
            url: fail ? i.url : (i.url ?? URL.createObjectURL(i.file)),
          } : i);
        }
        return prev.map(i => i.id === id ? { ...i, progress: next } : i);
      });
    }, 180);
    timers.current[id] = t;
  };

  const addFiles = (files: FileList | File[]) => {
    const max = maxSizeMB * 1024 * 1024;
    const fresh: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      url: undefined,
      progress: 0,
      status: f.size > max ? "error" : "idle",
      error: f.size > max ? `Exceeds ${maxSizeMB}MB` : undefined,
    }));
    setItems(prev => {
      const next = multiple ? [...prev.filter(i => i.id !== "preview"), ...fresh] : [fresh[0]];
      if (autoStart) next.forEach(i => { if (i.status === "idle") startUpload(i.id); });
      return next;
    });
  };

  const retry = (id: string) => startUpload(id);
  const remove = (id: string) => { clearTimer(id); setItems(prev => prev.filter(i => i.id !== id)); };
  const cancelAll = () => {
    Object.keys(timers.current).forEach(clearTimer);
    setItems(prev => prev.map(i => (i.status === "uploading" ? { ...i, status: "error", error: "Canceled" } : i)));
  };

  return (
    <div className="grid gap-4">
      {/* Dropzone always visible */}
      <FileUploadDropzone
        label={label}
        helper={helper}
        accept={accept}
        multiple={multiple}
        accent={accent}
        onFiles={addFiles}
      />

      {/* List appears ONLY when there are files */}
      <UploadList
        items={items}
        accent={accent}
        onRetry={retry}
        onRemove={remove}
        onCancelAll={cancelAll}
      />
    </div>
  );
}
