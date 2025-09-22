"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

// -------- Types (named export so other files can import 'type { PickedPlace }') -----
export type PickedPlace = {
  lat: number;
  lng: number;
  address: string;
};

// -------- Maroon marker icon (SVG data URL) ----------------------------------------
const MAROON = "#7A0010";
const svgPin = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48">
     <path d="M16 0C7.7 0 1 6.7 1 15c0 10.5 13.7 31.1 14.3 32 .4.6 1 .6 1.4 0C17.3 46.1 31 25.5 31 15 31 6.7 24.3 0 16 0z" fill="${MAROON}"/>
     <circle cx="16" cy="15" r="6" fill="white"/>
   </svg>`
);
const maroonIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=utf-8,${svgPin}`,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -44],
  shadowUrl: undefined,
});

// -------- Helpers for map control --------------------------------------------------
function CenterOn({ lat, lng, zoom = 15 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

function ClickPicker({ onPickPos }: { onPickPos: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPickPos(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// -------- Nominatim search / reverse ----------------------------------------------
type NominatimHit = { display_name: string; lat: string; lon: string };

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
    countrycodes: "ph",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!res.ok) return [] as NominatimHit[];
  return (await res.json()) as NominatimHit[];
}

async function nominatimReverse(lat: number, lon: number) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lon),
    addressdetails: "1",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
  if (!res.ok) return null;
  return await res.json();
}

// -------- Component ----------------------------------------------------------------
type Props = {
  open: boolean; // kept for symmetry; not used
  onClose: () => void;
  onPick: (p: PickedPlace) => void;
  initial?: PickedPlace | null;
};

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

  function pickAndCenter(lat: number, lng: number, address: string) {
    setChosen({ lat, lng, address });
    setQuery(address);
    setResults([]);
  }

  function selectResult(hit: NominatimHit) {
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    pickAndCenter(lat, lng, hit.display_name);
  }

  async function handleMapClick(lat: number, lng: number) {
    try {
      const rev = await nominatimReverse(lat, lng);
      const addr = rev?.display_name ?? `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`;
      pickAndCenter(lat, lng, addr);
    } catch {
      pickAndCenter(lat, lng, `lat: ${lat.toFixed(6)}, lng: ${lng.toFixed(6)}`);
    }
  }

  function useThisLocation() {
    if (!chosen) return;
    onPick(chosen);
    onClose();
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
          placeholder="Search address or place (OpenStreetMap Nominatim)"
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
            {/* re-center the map whenever chosen changes */}
            {chosen && <CenterOn lat={chosen.lat} lng={chosen.lng} />}
            <ClickPicker onPickPos={handleMapClick} />
            {chosen && <Marker position={[chosen.lat, chosen.lng]} icon={maroonIcon} />}
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
