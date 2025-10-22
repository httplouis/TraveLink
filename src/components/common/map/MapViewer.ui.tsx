// src/components/common/map/MapViewer.ui.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";

/* Client-only wrapper around your Leaflet MapPicker.ui
   Note: we intentionally type this as any to avoid prop overload issues
   since MapPicker.ui is an internal component with its own prop signature. */
const InnerMapPicker = dynamic<any>(
  async () => {
    const m = await import("./MapPicker.ui");
    // support both default export and named export
    return (m.default ?? (m as any).MapPicker) as React.ComponentType<any>;
  },
  { ssr: false }
);

export type LatLng = [number, number];

type Props = {
  center: LatLng;
  zoom?: number;
  marker?: LatLng;
  label?: string;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function MapViewer({
  center,
  zoom = 13,
  marker,
  label,
  readOnly = true,
  className = "",
  style,
}: Props) {
  return (
    <div className={["h-full w-full", className].join(" ")} style={style}>
      <React.Suspense fallback={<Fallback />}>
        <InnerMapPicker
          /* pass-through; MapPicker.ui may ignore unknown props */
          center={center as any}
          zoom={zoom as any}
          readOnly={readOnly as any}
          marker={marker as any}
          label={label as any}
        />
      </React.Suspense>
    </div>
  );
}

function Fallback() {
  return (
    <div
      className="h-full w-full"
      style={{ background: "linear-gradient(180deg,#f5f5f5 0%,#e6e6e6 100%)" }}
    />
  );
}
