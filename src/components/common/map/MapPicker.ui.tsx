"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { PickedPlace } from "./MapPickerLeafletImpl";

// Client-only import of the Leaflet implementation
const MapPickerLeaflet = dynamic(() => import("./MapPickerLeafletImpl"), {
  ssr: false,
  loading: () => null,
});

export type { PickedPlace };

function usePortalTarget() {
  const [el, setEl] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let target = document.getElementById("travilink-portal-root") as HTMLElement | null;
    if (!target) {
      target = document.createElement("div");
      target.id = "travilink-portal-root";
      document.body.appendChild(target);
    }
    setEl(target);
  }, []);

  return el;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  initial?: PickedPlace | null;
};

export default function MapPicker({ open, onClose, onPick, initial }: Props) {
  if (typeof window === "undefined") return null;

  const portalTarget = usePortalTarget();
  const escHandler = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  React.useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", escHandler);
    return () => document.removeEventListener("keydown", escHandler);
  }, [open, escHandler]);

  if (!portalTarget || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] grid place-items-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="mx-4 w-[min(1000px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Leaflet implementation handles the inner UI */}
        <MapPickerLeaflet open onClose={onClose} onPick={onPick} initial={initial ?? null} />
      </div>
    </div>,
    portalTarget
  );
}
