"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { BRAND_MAROON } from "@/lib/profile";

export default function CropperModal({
  src,
  onClose,
  onSave,
  exportSize = 640,
}: {
  src: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  exportSize?: number;
}) {
  const baseViewport = 360;
  const [ratio, setRatio] = useState<"1:1" | "4:5" | "16:9" | "3:2">("1:1");
  const [circleMask, setCircleMask] = useState(true);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const cropW = baseViewport;
  const cropH = useMemo(() => {
    const [a, b] = ratio.split(":").map(Number);
    return Math.round((cropW * b) / a);
  }, [ratio]);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  const [scale, setScale] = useState(1);
  const baseScale = useRef(1);
  const [angle, setAngle] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const pinch = useRef<{ d: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      const s = Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
      baseScale.current = s;
      setScale(1);
      setPos({ x: (cropW - img.naturalWidth * s) / 2, y: (cropH - img.naturalHeight * s) / 2 });
      setImgReady(true);
    };
    img.src = src;
  }, [src, cropW, cropH]);

  const clampPosition = (nx: number, ny: number, sc = scale, ang = angle) => {
    if (Math.abs(((ang % 360) + 360) % 360) < 5) {
      const sFull = baseScale.current * sc;
      const w = imgNatural.w * sFull;
      const h = imgNatural.h * sFull;
      const minX = Math.min(0, cropW - w);
      const minY = Math.min(0, cropH - h);
      const maxX = Math.max(0, cropW - w);
      const maxY = Math.max(0, cropH - h);
      nx = Math.max(minX, Math.min(nx, maxX));
      ny = Math.max(minY, Math.min(ny, maxY));
    }
    return { x: nx, y: ny };
  };

  const applyZoomAtPoint = (delta: number, cx: number, cy: number) => {
    const prevScale = scale;
    const next = Math.min(5, Math.max(0.5, prevScale + delta));
    if (next === prevScale) return;

    const sFullPrev = baseScale.current * prevScale;
    const sFullNext = baseScale.current * next;

    const imgX = cx - pos.x;
    const imgY = cy - pos.y;

    const rx = imgX / sFullPrev;
    const ry = imgY / sFullPrev;

    const nx = cx - rx * sFullNext;
    const ny = cy - ry * sFullNext;

    setPos(clampPosition(nx, ny, next, angle));
    setScale(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setPos(clampPosition(pos.x + dx, pos.y + dy));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  };
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    applyZoomAtPoint(-e.deltaY / 600, e.clientX - rect.left, e.clientY - rect.top);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinch.current = { d };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (d - pinch.current.d) / 300;
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      applyZoomAtPoint(delta, cx, cy);
      pinch.current.d = d;
    }
  };
  const onTouchEnd = () => (pinch.current = null);

  const fit = () => {
    const s = Math.min(cropW / imgNatural.w, cropH / imgNatural.h);
    baseScale.current = s;
    setScale(1);
    setAngle(0);
    setFlipX(false);
    setPos({ x: (cropW - imgNatural.w * s) / 2, y: (cropH - imgNatural.h * s) / 2 });
  };
  const fill = () => {
    const s = Math.max(cropW / imgNatural.w, cropH / imgNatural.h);
    baseScale.current = s;
    setScale(1);
    setAngle(0);
    setFlipX(false);
    setPos({ x: (cropW - imgNatural.w * s) / 2, y: (cropH - imgNatural.h * s) / 2 });
  };
  const reset = () => fill();

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;
    const [a, b] = ratio.split(":").map(Number);
    const outW = exportSize;
    const outH = Math.round((exportSize * b) / a);

    const c = document.createElement("canvas");
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext("2d")!;

    ctx.clearRect(0, 0, outW, outH);

    if (ratio === "1:1" && circleMask) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    const sx = outW / cropW;
    const sy = outH / cropH;

    ctx.save();
    ctx.scale(sx, sy);

    const fullScale = baseScale.current * scale;
    const imgCenterX = pos.x + (imgNatural.w * fullScale) / 2;
    const imgCenterY = pos.y + (imgNatural.h * fullScale) / 2;

    ctx.translate(imgCenterX, imgCenterY);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(flipX ? -1 : 1, 1);

    ctx.drawImage(
      img,
      -(imgNatural.w * fullScale) / 2,
      -(imgNatural.h * fullScale) / 2,
      imgNatural.w * fullScale,
      imgNatural.h * fullScale
    );

    ctx.restore();
    if (ratio === "1:1" && circleMask) ctx.restore();

    onSave(c.toDataURL("image/png"));
  };

  useEffect(() => {
    if (!imgReady) return;
    const s = Math.max(cropW / imgNatural.w, cropH / imgNatural.h);
    const nextBase = Math.min(baseScale.current, s);
    baseScale.current = nextBase;
    setScale((prev) => Math.max(prev, s / nextBase));
    setPos({
      x: (cropW - imgNatural.w * baseScale.current * scale) / 2,
      y: (cropH - imgNatural.h * baseScale.current * scale) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, cropW, cropH]);

  const gridOverlay =
    "linear-gradient(to right, rgba(255,255,255,.2) 1px, transparent 1px) 0 0 / calc(100%/3) 100%, " +
    "linear-gradient(to bottom, rgba(255,255,255,.2) 1px, transparent 1px) 0 0 / 100% calc(100%/3)";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm grid place-items-center p-4" data-cropper-root>
      <div className="w-full max-w-[980px] rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-neutral-600" />
            <div className="font-semibold">Adjust profile photo</div>
          </div>
          <button className="p-2 rounded-md hover:bg-neutral-100" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid md:grid-cols-[auto_320px] gap-0">
          {/* Viewport */}
          <div className="p-4 md:p-6 grid place-items-center">
            <div ref={viewportRef} className="relative" style={{ width: cropW, height: cropH }}>
              <div
                className="absolute inset-0 rounded-xl overflow-hidden"
                style={{
                  background:
                    "conic-gradient(#f3f3f3 25%, transparent 0 50%, #f3f3f3 0 75%, transparent 0) top left / 16px 16px",
                }}
              />
              <div
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                role="img"
                aria-label="Image crop area"
              >
                {imgReady && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt="Crop"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: pos.x,
                      top: pos.y,
                      width: imgNatural.w * baseScale.current * scale,
                      height: imgNatural.h * baseScale.current * scale,
                      transform: `rotate(${angle}deg) scaleX(${flipX ? -1 : 1})`,
                      transformOrigin: "center center",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>

              {/* Mask */}
              <div className="absolute inset-0 pointer-events-none">
                {ratio === "1:1" && circleMask ? (
                  <div className="absolute inset-0 rounded-full ring-2 ring-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]" />
                ) : (
                  <div
                    className="absolute inset-0 rounded-xl ring-2 ring-white/95 shadow-[0_0_0_9999px_rgba(0,0,0,0.38)]"
                    style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.38)" }}
                  />
                )}
                <div className="absolute inset-0 mix-blend-overlay" style={{ backgroundImage: gridOverlay }} />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="border-t md:border-t-0 md:border-l p-4 md:p-5 grid gap-4 content-start">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-neutral-700">Aspect ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {(["1:1", "4:5", "16:9", "3:2"] as const).map((r) => {
                  const active = ratio === r;
                  return (
                    <button
                      key={r}
                      className={`px-2.5 py-1.5 text-sm rounded-md border transition ${
                        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 hover:bg-neutral-50"
                      }`}
                      onClick={() => setRatio(r)}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <label className={`flex items-center gap-2 text-sm ${ratio !== "1:1" ? "opacity-50 pointer-events-none" : ""}`}>
                <input type="checkbox" checked={circleMask} onChange={(e) => setCircleMask(e.target.checked)} />
                Circular mask (avatar)
              </label>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-neutral-700">Quick actions</label>
              <div className="flex flex-wrap gap-2">
                <button className="px-2.5 py-1.5 text-sm rounded-md border hover:bg-neutral-50 flex items-center gap-1.5" onClick={fit}>
                  <Minimize2 className="w-4 h-4" /> Fit
                </button>
                <button className="px-2.5 py-1.5 text-sm rounded-md border hover:bg-neutral-50 flex items-center gap-1.5" onClick={fill}>
                  <Maximize2 className="w-4 h-4" /> Fill
                </button>
                <button className="px-2.5 py-1.5 text-sm rounded-md border hover:bg-neutral-50 flex items-center gap-1.5" onClick={reset}>
                  <RotateCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-neutral-700">Zoom</label>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-md border hover:bg-neutral-50"
                  onClick={() => applyZoomAtPoint(-0.1, cropW / 2, cropH / 2)}
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.01}
                  value={scale}
                  onChange={(e) => applyZoomAtPoint(Number(e.target.value) - scale, cropW / 2, cropH / 2)}
                  className="w-full accent-[#7A0010]"
                />
                <button
                  className="p-2 rounded-md border hover:bg-neutral-50"
                  onClick={() => applyZoomAtPoint(+0.1, cropW / 2, cropH / 2)}
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-medium text-neutral-700">Rotation</label>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md border hover:bg-neutral-50 rotate-180" onClick={() => setAngle((a) => (a - 90) % 360)} title="Rotate -90°">
                  <RotateCw className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-[#7A0010]"
                />
                <button className="p-2 rounded-md border hover:bg-neutral-50" onClick={() => setAngle((a) => (a + 90) % 360)} title="Rotate +90°">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-md border hover:bg-neutral-50" onClick={() => setFlipX((v) => !v)} title="Flip horizontal">
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            <PreviewThumb
              src={src}
              cropW={cropW}
              cropH={cropH}
              imgNatural={imgNatural}
              baseScale={baseScale.current}
              scale={scale}
              angle={angle}
              flipX={flipX}
              pos={pos}
              circle={ratio === "1:1" && circleMask}
            />

            <div className="mt-2 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-md border hover:bg-neutral-50" onClick={onClose}>
                Cancel
              </button>
              <button className="px-3 py-2 rounded-md text-white" style={{ background: BRAND_MAROON }} onClick={handleSave}>
                Save
              </button>
            </div>

            <p className="text-[11px] text-neutral-500">
              Tip: drag to pan • scroll/pinch to zoom • arrows to nudge (Shift = 10px).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewThumb({
  src,
  cropW,
  cropH,
  imgNatural,
  baseScale,
  scale,
  angle,
  flipX,
  pos,
  circle,
}: {
  src: string;
  cropW: number;
  cropH: number;
  imgNatural: { w: number; h: number };
  baseScale: number;
  scale: number;
  angle: number;
  flipX: boolean;
  pos: { x: number; y: number };
  circle: boolean;
}) {
  const pw = 96;
  const ph = Math.round((pw * cropH) / cropW);
  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-neutral-700">Preview</label>
      <div className="relative" style={{ width: pw, height: ph }}>
        <div className="absolute inset-0 rounded-md overflow-hidden bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="preview"
            draggable={false}
            style={{
              position: "absolute",
              left: (pos.x / cropW) * pw,
              top: (pos.y / cropH) * ph,
              width: (imgNatural.w * baseScale * scale * pw) / cropW,
              height: (imgNatural.h * baseScale * scale * ph) / cropH,
              transform: `rotate(${angle}deg) scaleX(${flipX ? -1 : 1})`,
              transformOrigin: "center center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>
        {circle ? (
          <div className="absolute inset-0 rounded-full ring-1 ring-white shadow-[0_0_0_999px_rgba(0,0,0,0.25)] pointer-events-none" />
        ) : (
          <div className="absolute inset-0 rounded-md ring-1 ring-white shadow-[0_0_0_999px_rgba(0,0,0,0.25)] pointer-events-none" />
        )}
      </div>
    </div>
  );
}
