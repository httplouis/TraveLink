// components/user/request/ui/LocationField.ui.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Modal from "@/components/common/Modal/Modal";

// Leaflet picker (client-only)
const CommonMapPicker = dynamic(
  () => import("@/components/common/map/MapPicker.ui"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center text-sm text-neutral-500">
        Loading map…
      </div>
    ),
  }
);

type Geo = { lat: number; lng: number; address?: string };

export default function LocationField({
  label,
  value,
  geo,
  onChange,
  inputId,
  placeholder = "Type address or pick on map…",
}: {
  label: string;
  value: string;
  geo?: Geo | null;
  onChange: (next: { address: string; geo?: Geo | null }) => void;
  inputId?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);

  function handlePicked(p: { address: string; lat: number; lng: number }) {
    onChange({
      address: p.address,
      geo: { lat: p.lat, lng: p.lng, address: p.address },
    });
    setOpen(false);
  }

  return (
    <div className="grid gap-1.5 w-full">
      <label className="text-[13px] font-semibold text-gray-800 leading-tight">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange({ address: e.target.value, geo })}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border-2 border-gray-300 bg-white px-4 pr-12 text-sm font-medium outline-none transition shadow-sm focus:border-[#7A0010] focus:ring-2 focus:ring-[#7A0010]/20 hover:border-gray-400"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Pick on map"
          className="absolute inset-y-0 right-0 px-2 rounded-r-xl text-[#7A0010] hover:bg-neutral-50/70 focus:outline-none focus:ring-2 focus:ring-[#7A0010]/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className="mx-1"
          >
            <path d="M12 22s7-5.33 7-12A7 7 0 0 0 5 10c0 6.67 7 12 7 12Z" />
            <circle cx="12" cy="10" r="2.75" />
          </svg>
        </button>
      </div>
      {geo?.lat != null && geo?.lng != null && (
        <span className="mt-0.5 text-xs text-gray-500">
          Selected: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
        </span>
      )}

      {/* Use your Modal implementation (no title prop) */}
      {typeof Modal === "function" ? (
        <Modal open={open} onClose={() => setOpen(false)}>
          <div className="h-[65vh] w-full">
            <CommonMapPicker
              open
              onClose={() => setOpen(false)}
              onPick={handlePicked}
              initial={
                geo?.lat != null && geo?.lng != null
                  ? { lat: geo.lat, lng: geo.lng, address: geo.address ?? value }
                  : null
              }
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
