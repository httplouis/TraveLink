"use client";

import * as React from "react";
import type { Driver } from "@/lib/user/fleet/store";

function initials(first: string, last: string) {
  return (first[0] ?? "") + (last[0] ?? "");
}

function DriverBadge({ s }: { s: Driver["status"] }) {
  const map = {
    "Available": "bg-green-100 text-green-700",
    "On Trip":   "bg-amber-100 text-amber-700",
    "Off Duty":  "bg-neutral-100 text-neutral-700",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[s]}`}>{s}</span>;
}

export default function DriversList() {
  const [rows, setRows] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);

  // Fetch drivers from API
  React.useEffect(() => {
    async function fetchDrivers() {
      try {
        setLoading(true);
        const response = await fetch('/api/drivers');
        const data = await response.json();
        
        if (data.ok && data.data) {
          // Transform API response to Driver format
          const drivers: Driver[] = data.data.map((d: any) => {
            // Parse name (format: "LASTNAME, FIRSTNAME" or "First Last")
            const nameParts = d.name?.split(', ') || d.name?.split(' ') || ['Unknown', ''];
            const firstName = nameParts.length > 1 && nameParts[0].includes(',') 
              ? nameParts[1] 
              : nameParts[0];
            const lastName = nameParts.length > 1 && nameParts[0].includes(',')
              ? nameParts[0]
              : (nameParts[1] || '');
            
            // Determine status from assignments
            const hasActiveAssignment = d.assignments && d.assignments.length > 0;
            const status: "Available" | "On Trip" | "Off Duty" = 
              !d.isAvailable ? "Off Duty" :
              hasActiveAssignment ? "On Trip" :
              "Available";
            
            // Default canDrive based on common vehicle types (can be enhanced with actual data)
            const canDrive: ("Bus" | "Van" | "Car" | "Truck")[] = ["Bus", "Van", "Car"];
            
            return {
              id: d.id,
              firstName: firstName.trim() || 'Unknown',
              lastName: lastName.trim() || '',
              status,
              canDrive,
              lastActive: d.assignments?.[0]?.startDate || undefined,
            };
          });
          setRows(drivers);
        }
      } catch (error) {
        console.error('[DriversList] Error fetching drivers:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDrivers();
  }, []);

  const filtered = React.useMemo(() => {
    let base = rows;
    if (onlyAvailable) base = base.filter(d => d.status === "Available");
    if (q.trim()) {
      const s = q.toLowerCase();
      base = base.filter(d =>
        [d.firstName, d.lastName, ...d.canDrive].join(" ").toLowerCase().includes(s)
      );
    }
    return base;
  }, [rows, q, onlyAvailable]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <input
          className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          placeholder="Search by name or license class…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only available
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8 text-neutral-500">
          Loading drivers...
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
          <div key={d.id} className="rounded-xl border border-neutral-200 p-4">
            <div className="flex items-start gap-3">
              {/* Privacy: show initials avatar, never a photo */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
                {initials(d.firstName, d.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate font-semibold">
                    {d.firstName} {d.lastName}
                  </div>
                  <DriverBadge s={d.status} />
                </div>
                <div className="mt-0.5 text-xs text-neutral-500">
                  Licenses: {d.canDrive.join(", ")}
                </div>
                {d.lastActive && (
                  <div className="mt-0.5 text-[11px] text-neutral-400">
                    Last active: {new Date(d.lastActive).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
          {!filtered.length && (
            <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-neutral-500">
              {loading ? "Loading drivers..." : "No drivers match your filters."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
