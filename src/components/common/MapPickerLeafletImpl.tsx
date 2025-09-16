// src/components/common/MapPickerLeafletImpl.tsx
"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

//
// Default marker icons — copy these files to:
//   /public/leaflet/marker-icon.png
//   /public/leaflet/marker-icon-2x.png
//   /public/leaflet/marker-shadow.png
//
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

export type PickedPlace = {
  lat: number;
  lng: number;
  address: string;
};

type Props = {
  open: boolean;                 // (kept for API symmetry; not used here)
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  initial?: PickedPlace | null;
};

type NominatimHit = {
  display_name: string;
  lat: string;
  lon: string;
};

// tiny debounce so we don't spam Nominatim when typing
function useDebounced<T extends (...args: any[]) => void>(fn: T, delay = 400) {
  const t = React.useRef<number | null>(null);
  return React.useCallback(
    (...args: Parameters<T>) => {
      if (t.current) window.clearTimeout(t.current);
      t.current = window.setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  );
}

async function nominatimSearch(q: string) {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    limit: "8",
    dedupe: "1",
    addressdetails: "1",
    autocomplete: "1",
    countrycodes: "ph", // bias to PH; remove if you want global
  });
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return (await res.json()) as NominatimHit[];
}

async function nominatimReverse(lat: number, lon: number) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    addressdetails: "1",
  });
  const url = `https://nominatim.openstreetmap.org/reverse?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

function ClickPicker({ onPickPos }: { onPickPos: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPickPos(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPickerLeafletImpl({ onClose, onPick, initial }: Props) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<NominatimHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [chosen, setChosen] = React.useState<PickedPlace | null>(initial ?? null);

  const center = chosen
    ? ([chosen.lat, chosen.lng] as [number, number])
    : ([14.5995, 120.9842] as [number, number]); // Manila default

  const runSearch = useDebounced(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const hits = await nominatimSearch(trimmed);
      setResults(hits);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 450);

  function onQueryChange(v: string) {
    setQuery(v);
    runSearch(v);
  }

  function selectResult(hit: NominatimHit) {
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    setChosen({ lat, lng, address: hit.display_name });
    setResults([]);
    setQuery(hit.display_name);
  }

  async function handleMapClick(lat: number, lng: number) {
    try {
      const rev = await nominatimReverse(lat, lng);
      const addr =
        rev?.display_name ?? `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`;
      setChosen({ lat, lng, address: addr });
      setQuery(addr);
      setResults([]);
    } catch {
      setChosen({
        lat,
        lng,
        address: `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`,
      });
    }
  }

  function useThisLocation() {
    if (!chosen) return;
    onPick(chosen);
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="text-base font-semibold">Pick location</div>
        <button
          onClick={onClose}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Close
        </button>
      </div>

      {/* Search */}
      <div className="relative p-3">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="h-11 w-full rounded-lg border px-3"
          placeholder="Search address or place (Nominatim)"
        />
        {query && (results.length > 0 || loading) && (
          <div className="absolute left-3 right-3 top-[3.25rem] z-[2] max-h-64 overflow-auto rounded-lg border bg-white shadow-lg">
            {loading && (
              <div className="px-3 py-2 text-sm text-neutral-500">Searching…</div>
            )}
            {results.map((r, i) => (
              <button
                key={`${r.lat}-${r.lon}-${i}`}
                onClick={() => selectResult(r)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="px-3 pb-3">
        <div className="h-[60vh] w-full overflow-hidden rounded-xl border">
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickPicker onPickPos={handleMapClick} />
            {chosen && <Marker position={[chosen.lat, chosen.lng]} />}
          </MapContainer>
        </div>

        {/* Chosen preview */}
        <div className="mt-2 rounded-md border bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
          <div className="font-medium">Chosen:</div>
          <div className="truncate">{chosen?.address ?? "—"}</div>
          <div>
            lat: {chosen?.lat?.toFixed(6) ?? "—"}, lng: {chosen?.lng?.toFixed(6) ?? "—"}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
        <button onClick={onClose} className="h-10 rounded-lg border px-4">
          Cancel
        </button>
        <button
          onClick={useThisLocation}
          disabled={!chosen}
          className="h-10 rounded-lg bg-[#7A0010] px-4 text-white disabled:opacity-50"
        >
          Use this location
        </button>
      </div>
    </div>
  );
}
