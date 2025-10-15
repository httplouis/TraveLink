// src/components/admin/schedule/ScheduleFiltersURLSync.tsx
"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Accept both TitleCase and UPPER_CASE for status */
const STATUS = [
  "All",
  "Planned", "InProgress", "Completed", "Cancelled",
  "PLANNED", "ONGOING", "COMPLETED", "CANCELLED",
] as const;

const DEPT = ["All", "CCMS", "HR", "Registrar", "Finance"] as const;
const MODE = ["auto", "apply"] as const;

const isIn = <T extends readonly string[]>(vs: T, v: string): v is T[number] =>
  (vs as readonly string[]).includes(v);

export type ScheduleFilterDraft = {
  status?: typeof STATUS[number];
  dept?: typeof DEPT[number];
  driver?: "All" | string;     // driverId
  vehicle?: "All" | string;    // vehicleId
  from?: string | null;        // YYYY-MM-DD
  to?: string | null;          // YYYY-MM-DD
  mode?: typeof MODE[number];  // auto = apply immediately
};

type Props = {
  draft: ScheduleFilterDraft;
  onDraftChange: (patch: Partial<ScheduleFilterDraft>) => void;
};

export default function ScheduleFiltersURLSync({ draft, onDraftChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = React.useRef("");

  /** READ ONCE from URL → draft */
  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();

    const status  = sp.get("status")  ?? undefined;
    const dept    = sp.get("dept")    ?? undefined;
    const driver  = sp.get("driver")  ?? undefined;
    const vehicle = sp.get("vehicle") ?? undefined;
    const from    = sp.get("from");
    const to      = sp.get("to");
    const mode    = sp.get("mode")    ?? undefined;

    const next: Partial<ScheduleFilterDraft> = {};
    if (status && isIn(STATUS, status)) next.status = status;
    if (dept && isIn(DEPT, dept))       next.dept = dept;
    if (driver)                         next.driver = driver as any;
    if (vehicle)                        next.vehicle = vehicle as any;
    next.from = from ?? null;
    next.to   = to   ?? null;
    if (mode && isIn(MODE, mode))       next.mode = mode;

    if (Object.keys(next).length) onDraftChange(next);

    // snapshot to avoid redundant writes
    lastRef.current = JSON.stringify({
      status:  next.status  ?? "",
      dept:    next.dept    ?? "",
      driver:  next.driver  ?? "",
      vehicle: next.vehicle ?? "",
      from:    next.from    ?? "",
      to:      next.to      ?? "",
      mode:    next.mode    ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** WRITE whenever draft changes → URL */
  React.useEffect(() => {
    const payload = {
      status:  draft.status  ?? "",
      dept:    draft.dept    ?? "",
      driver:  draft.driver  ?? "",
      vehicle: draft.vehicle ?? "",
      from:    draft.from    ?? "",
      to:      draft.to      ?? "",
      mode:    draft.mode    ?? "",
    };
    const str = JSON.stringify(payload);
    if (str === lastRef.current) return;

    const sp = new URLSearchParams(searchParams?.toString() ?? "");

    // Only keep meaningful params in the URL
    if (draft.status && draft.status !== "All") sp.set("status", draft.status);
    else sp.delete("status");

    if (draft.dept && draft.dept !== "All") sp.set("dept", draft.dept);
    else sp.delete("dept");

    if (draft.driver && draft.driver !== "All") sp.set("driver", draft.driver);
    else sp.delete("driver");

    if (draft.vehicle && draft.vehicle !== "All") sp.set("vehicle", draft.vehicle);
    else sp.delete("vehicle");

    draft.from ? sp.set("from", draft.from) : sp.delete("from");
    draft.to   ? sp.set("to",   draft.to)   : sp.delete("to");

    draft.mode ? sp.set("mode", draft.mode) : sp.delete("mode");

    lastRef.current = str;
    router.replace(`${pathname}?${sp.toString()}`);
  }, [draft, pathname, router, searchParams]);

  return null;
}
