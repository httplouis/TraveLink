"use client";

import * as React from "react";

type Props = {
  /** Height of the drawing area in px (width is 100%) */
  height?: number;
  /** Line width in px */
  lineWidth?: number;
  /** Stroke color */
  color?: string;

  /** Existing signature (data URL) to preload onto the canvas */
  value?: string | null;
  /** @deprecated Use `value` instead. Kept for compatibility. */
  initialImage?: string | null;

  /** Fired the first time the user starts drawing */
  onDraw?: () => void;
  /** Called when a save is requested (button or auto-save on pointerup) */
  onSave?: (dataUrl: string) => void;
  /** Called when user clicks "Clear" */
  onClear?: () => void;
  /** Optional: handle file upload yourself */
  onUpload?: (file: File) => void;
  /** Called when user clicks "Use Saved Signature" */
  onUseSaved?: (dataUrl: string) => void;

  /** Disable the Save button (when shown) */
  saveDisabled?: boolean;

  /** Hide the manual "Save signature" button (autosave-only UX) */
  hideSaveButton?: boolean;

  /** Show "Use Saved Signature" button */
  showUseSavedButton?: boolean;

  className?: string;
};

export default function SignaturePad({
  height = 160,
  lineWidth = 3,
  color = "#1f2937",
  value = null,
  initialImage = null,
  onDraw,
  onSave,
  onClear,
  onUpload,
  onUseSaved,
  saveDisabled = false,
  hideSaveButton = false,
  showUseSavedButton = false,
  className = "",
}: Props) {
  const [savedSignature, setSavedSignature] = React.useState<string | null>(null);
  const [loadingSaved, setLoadingSaved] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const drawingRef = React.useRef(false);
  const drewOnceRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const lastYRef = React.useRef(0);

  // Size canvas to wrapper; keep resolution crisp on HiDPI
  const resizeCanvas = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      ctxRef.current = null;
      return;
    }
    ctxRef.current = ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }, []);

  React.useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  const loadSavedSignature = React.useCallback(async () => {
    try {
      setLoadingSaved(true);
      const res = await fetch("/api/settings/signature");
      if (!res.ok) {
        console.warn("[SignaturePad] Signature API not OK:", res.status);
        return;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("[SignaturePad] Signature API returned non-JSON response");
        return;
      }
      const data = await res.json();
      if (data.ok && data.data?.signature) {
        setSavedSignature(data.data.signature);
      }
    } catch (err) {
      console.error("Failed to load saved signature:", err);
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  // Load saved signature if showUseSavedButton is true (only once)
  const hasLoadedRef = React.useRef(false);
  React.useEffect(() => {
    if (showUseSavedButton && !savedSignature && !loadingSaved && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSavedSignature();
    }
  }, [showUseSavedButton]); // Only depend on showUseSavedButton to prevent loops

  const handleUseSaved = React.useCallback(() => {
    if (savedSignature && onUseSaved) {
      onUseSaved(savedSignature);
      // Also draw it on canvas
      drawImageToCanvas(savedSignature);
      onSave?.(savedSignature);
    }
  }, [savedSignature, onUseSaved, onSave]);

  // Draw a dataURL image to canvas (for preload & uploads)
  const drawImageToCanvas = React.useCallback((dataUrl: string) => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!wrapper || !canvas || !ctx) return;

    const img = new Image();
    img.onload = () => {
      const rect = wrapper.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    };
    img.src = dataUrl;
  }, []);

  // Preload existing signature if any
  React.useEffect(() => {
    if (value) {
      drawImageToCanvas(value);
    } else if (initialImage) {
      drawImageToCanvas(initialImage);
    } else {
      // Clear canvas when no signature
      const ctx = ctxRef.current;
      const wrapper = wrapperRef.current;
      if (ctx && wrapper) {
        const rect = wrapper.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        drewOnceRef.current = false; // Reset draw state
      }
    }
  }, [value, initialImage, drawImageToCanvas]);

  // Pointer utilities
  function getPos(e: PointerEvent) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return { x: 0, y: 0 };
    const rect = wrapper.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    return { x, y };
  }

  function begin(e: PointerEvent) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    drawingRef.current = true;
    const p = getPos(e);
    lastXRef.current = p.x;
    lastYRef.current = p.y;

    if (!drewOnceRef.current) {
      drewOnceRef.current = true;
      onDraw?.();
    }
  }

  function move(e: PointerEvent) {
    const ctx = ctxRef.current;
    if (!ctx || !drawingRef.current) return;

    e.preventDefault();
    const p = getPos(e);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    lastXRef.current = p.x;
    lastYRef.current = p.y;
  }

  function saveNow() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  }

  function end() {
    drawingRef.current = false;
    // Auto-save on pen/mouse up
    if (drewOnceRef.current) saveNow();
  }

  // Pointer wiring
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const down = (e: PointerEvent) => begin(e);
    const moveL = (e: PointerEvent) => move(e);
    const up = () => end();
    const leave = () => end();
    const cancel = () => end();

    el.addEventListener("pointerdown", down, { passive: false });
    window.addEventListener("pointermove", moveL, { passive: false });
    window.addEventListener("pointerup", up, { passive: false });
    window.addEventListener("pointerleave", leave, { passive: false });
    window.addEventListener("pointercancel", cancel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", moveL);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [color, lineWidth]);

  // Public actions
  function clear() {
    // Clear canvas immediately for instant feedback
    const ctx = ctxRef.current;
    const wrapper = wrapperRef.current;
    if (ctx && wrapper) {
      const rect = wrapper.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    drewOnceRef.current = false;
    // Also notify parent to update state
    onClear?.();
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onUpload) {
      onUpload(file);
      e.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      drawImageToCanvas(url);
      onSave?.(url); // persist uploaded image
      drewOnceRef.current = true;
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  }

  const helperAutosave =
    "Sign with mouse / touch — it auto-saves when you lift your pen.";
  const helperExtra = hideSaveButton
    ? " You can also upload an image file."
    : " You can also click Save signature or upload an image file.";

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="rounded-lg border border-neutral-300 bg-white p-2">
        {/* Fixed-height container to prevent layout shift while drawing */}
        <div ref={wrapperRef} className="relative w-full" style={{ height }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full"
            style={{ touchAction: "none", cursor: "crosshair" }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showUseSavedButton && savedSignature && (
          <button
            type="button"
            onClick={handleUseSaved}
            className="h-9 rounded-md border-2 border-green-500 bg-green-50 px-3 text-sm font-medium text-green-700 hover:bg-green-100 flex items-center gap-1.5"
            title="Use your saved signature from settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Use Saved Signature
          </button>
        )}

        <button
          type="button"
          onClick={clear}
          className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50"
        >
          Clear
        </button>

        {!hideSaveButton && (
          <button
            type="button"
            onClick={saveNow}
            disabled={saveDisabled}
            className={`h-9 rounded-md px-4 text-sm font-medium text-white ${
              saveDisabled ? "bg-neutral-400" : "bg-[#7A0010] hover:opacity-95"
            }`}
          >
            Save signature
          </button>
        )}

        <label className="ml-auto inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50">
          Upload e-sign
          <input type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
        </label>
      </div>

      <p className="text-[11px] text-neutral-500">
        {helperAutosave}
        {helperExtra}
      </p>
    </div>
  );
}
