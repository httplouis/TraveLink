// src/components/common/inputs/SignaturePad.ui.tsx
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
  /** @deprecated Use `value` instead. Still supported to avoid breaking callers. */
  initialImage?: string | null;

  /** Fired the first time the user starts drawing (mouse/touch down) */
  onDraw?: () => void;
  /** Called when user clicks “Save signature”; gives you PNG data URL */
  onSave?: (dataUrl: string) => void;
  /** Called when user clicks “Clear” */
  onClear?: () => void;
  /** Optional: if you want to handle file upload yourself */
  onUpload?: (file: File) => void;

  /** Disable the Save button (e.g. until something was drawn) */
  saveDisabled?: boolean;

  /** className for outer wrapper */
  className?: string;
};

export default function SignaturePad({
  height = 160,
  lineWidth = 3,
  color = "#1f2937", // neutral-800
  value = null,
  initialImage = null, // kept for compatibility
  onDraw,
  onSave,
  onClear,
  onUpload,
  saveDisabled = false,
  className = "",
}: Props) {
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const drawingRef = React.useRef(false);
  const drewOnceRef = React.useRef(false);
  const lastXRef = React.useRef(0);
  const lastYRef = React.useRef(0);

  // Fit the canvas to the wrapper (retina aware)
  const resizeCanvas = React.useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = wrapper.clientWidth;
    const cssH = height;

    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      ctxRef.current = null;
      return;
    }
    ctxRef.current = ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    ctx.scale(dpr, dpr);
  }, [height]);

  // Init / resize
  React.useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  // Draw a provided image (data URL) to the canvas
  const drawImageToCanvas = React.useCallback(
    (dataUrl: string) => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      const img = new Image();
      img.onload = () => {
        const w = canvas.clientWidth;
        const h = height;
        ctx.clearRect(0, 0, w, h);
        const scale = Math.min(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (w - dw) / 2;
        const dy = (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      };
      img.src = dataUrl;
    },
    [height]
  );

  // Load initial value / legacy initialImage
  React.useEffect(() => {
    if (value) drawImageToCanvas(value);
    else if (initialImage) drawImageToCanvas(initialImage);
  }, [value, initialImage, drawImageToCanvas]);

  // Helpers
  function getPos(e: MouseEvent | TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = (e as TouchEvent).touches?.[0];
    const clientX = touch?.clientX ?? (e as MouseEvent).clientX;
    const clientY = touch?.clientY ?? (e as MouseEvent).clientY;
    // Clamp to edges so drawing can continue when the pointer re-enters
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    return { x, y };
  }

  function begin(e: MouseEvent | TouchEvent) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    drawingRef.current = true;
    const p = getPos(e);
    lastXRef.current = p.x;
    lastYRef.current = p.y;

    if (!drewOnceRef.current) {
      drewOnceRef.current = true;
      onDraw?.();
    }
  }

  function move(e: MouseEvent | TouchEvent) {
    const ctx = ctxRef.current;
    if (!ctx || !drawingRef.current) return;

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

  function end() {
    drawingRef.current = false;
  }

  // Pointer wiring
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const opts = { passive: false } as AddEventListenerOptions;

    const mdown = (e: MouseEvent) => begin(e);
    const mmove = (e: MouseEvent) => move(e);
    const mup = () => end();

    const tstart = (e: TouchEvent) => {
      e.preventDefault();
      begin(e);
    };
    const tmove = (e: TouchEvent) => {
      e.preventDefault();
      move(e);
    };
    const tend = () => end();

    canvas.addEventListener("mousedown", mdown);
    canvas.addEventListener("mousemove", mmove);
    window.addEventListener("mouseup", mup);

    canvas.addEventListener("touchstart", tstart, opts);
    canvas.addEventListener("touchmove", tmove, opts);
    window.addEventListener("touchend", tend);

    return () => {
      canvas.removeEventListener("mousedown", mdown);
      canvas.removeEventListener("mousemove", mmove);
      window.removeEventListener("mouseup", mup);

      canvas.removeEventListener("touchstart", tstart);
      canvas.removeEventListener("touchmove", tmove);
      window.removeEventListener("touchend", tend);
    };
  }, [color, lineWidth]);

  // Public actions
  function clear() {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.clientWidth, height);
    onClear?.();
    // allow onDraw to fire again after clearing
    drewOnceRef.current = false;
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onUpload) {
      onUpload(file);
      e.currentTarget.value = "";
      return;
    }

    // default behavior: preview it on canvas
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      drawImageToCanvas(url);
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  }

  return (
    <div className={`grid gap-2 ${className}`} ref={wrapperRef}>
      <div className="rounded-lg border border-neutral-300 bg-white p-2">
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ height, touchAction: "none", cursor: "crosshair" }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={clear}
          className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saveDisabled}
          className={`h-9 rounded-md px-4 text-sm font-medium text-white ${
            saveDisabled ? "bg-neutral-400" : "bg-[#7A0010] hover:opacity-95"
          }`}
        >
          Save signature
        </button>

        <label className="ml-auto inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white px-3 text-sm hover:bg-neutral-50">
          Upload e-sign
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFilePicked}
          />
        </label>
      </div>

      <p className="text-[11px] text-neutral-500">
        Sign with mouse / touch, then click{" "}
        <span className="font-medium">Save signature</span> — or upload an image
        file of your e-signature.
      </p>
    </div>
  );
}
