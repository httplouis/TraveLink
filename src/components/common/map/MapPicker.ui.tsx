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
    // do not remove on unmount so it can be reused
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
  // Guard SSR
  if (typeof window === "undefined") return null;

  const portalTarget = usePortalTarget();
  if (!portalTarget || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="mx-3 w-[min(1000px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <MapPickerLeaflet open onClose={onClose} onPick={onPick} initial={initial ?? null} />
      </div>
    </div>,
    portalTarget
  );
}
