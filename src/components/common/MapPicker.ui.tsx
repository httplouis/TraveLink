"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { PickedPlace } from "./MapPickerLeafletImpl";

// Dynamically import the Leaflet impl (client only)
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
    return () => {
      // keep the portal for reuse; don’t remove
    };
  }, []);

  return el;
}

export default function MapPicker(props: {
  open: boolean;
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  initial?: PickedPlace | null;
}) {
  // Guard SSR
  if (typeof window === "undefined") return null;
  const target = usePortalTarget();
  if (!target || !props.open) return null;

  return createPortal(
    // Backdrop + centered card, isolated from the dialog’s stacking context
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50"
      onClick={props.onClose}
    >
      <div
        className="mx-3 w-[min(1000px,calc(100vw-1.5rem))] rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <MapPickerLeaflet {...props} />
      </div>
    </div>,
    target
  );
}
