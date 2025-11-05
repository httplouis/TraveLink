"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type VehiclesFilterDraft = {
  status?: "All" | "Available" | "InUse" | "Repair" | "Retired";
  type?: "All" | "Car" | "Van" | "Truck" | "Bus";
  from?: string;
  to?: string;
  mode?: "auto" | "apply";
};

const STATUS = ["All","Available","InUse","Repair","Retired"] as const;
const TYPE   = ["All","Car","Van","Truck","Bus"] as const;
const MODE   = ["auto","apply"] as const;
const isIn = <T extends readonly string[]>(vs: T, v: string): v is T[number] => (vs as readonly string[]).includes(v);

type Props = { draft: VehiclesFilterDraft; onDraftChange: (n: Partial<VehiclesFilterDraft>) => void; };

function VehiclesURLSyncContent({ draft, onDraftChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = React.useRef("");

  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();
    const next: Partial<VehiclesFilterDraft> = {};
    const status = sp.get("status") || undefined;
    const type   = sp.get("type") || undefined;
    const from   = sp.get("from") || undefined;
    const to     = sp.get("to") || undefined;
    const mode   = sp.get("mode") || undefined;

    if (status && isIn(STATUS, status)) next.status = status;
    if (type && isIn(TYPE, type)) next.type = type;
    if (from) next.from = from;
    if (to) next.to = to;
    if (mode && isIn(MODE, mode)) next.mode = mode;

    if (Object.keys(next).length) onDraftChange(next);
    lastRef.current = JSON.stringify({ status: next.status ?? "", type: next.type ?? "", from: next.from ?? "", to: next.to ?? "", mode: next.mode ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const payload = { status: draft.status ?? "", type: draft.type ?? "", from: draft.from ?? "", to: draft.to ?? "", mode: draft.mode ?? "" };
    const str = JSON.stringify(payload);
    if (str === lastRef.current) return;

    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    payload.status ? sp.set("status", payload.status) : sp.delete("status");
    payload.type ? sp.set("type", payload.type) : sp.delete("type");
    payload.from ? sp.set("from", payload.from) : sp.delete("from");
    payload.to ? sp.set("to", payload.to) : sp.delete("to");
    payload.mode ? sp.set("mode", payload.mode) : sp.delete("mode");

    lastRef.current = str;
    router.replace(`${pathname}?${sp.toString()}`);
  }, [draft, pathname, router, searchParams]);

  return null;
}

export default function VehiclesURLSync(props: Props) {
  return (
    <React.Suspense fallback={null}>
      <VehiclesURLSyncContent {...props} />
    </React.Suspense>
  );
}
