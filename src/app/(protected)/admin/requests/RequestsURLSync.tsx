"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterState } from "@/lib/admin/types";

/** Type guards to safely narrow string → your unions */
const STATUS_VALUES = ["All", "Pending", "Approved", "Completed", "Rejected"] as const;
const DEPT_VALUES = ["All", "CCMS", "HR", "Registrar", "Finance"] as const;
const MODE_VALUES = ["auto", "apply"] as const;

function isStatus(v: string): v is FilterState["status"] {
  return (STATUS_VALUES as readonly string[]).includes(v);
}
function isDept(v: string): v is FilterState["dept"] {
  return (DEPT_VALUES as readonly string[]).includes(v);
}
function isMode(v: string): v is FilterState["mode"] {
  return (MODE_VALUES as readonly string[]).includes(v);
}

type Props = {
  draft: FilterState; // status, dept, from, to, mode ("auto" | "apply")
  onDraftChange: (next: Partial<FilterState>) => void;
};

/** Filter-only URL sync (does NOT touch q/sort) */
export function RequestsURLSync({ draft, onDraftChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = React.useRef<string>("");

  // Read once on mount (filters only)
  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();
    const next: Partial<FilterState> = {};
    const statusRaw = sp.get("status") || undefined;
    const deptRaw = sp.get("dept") || undefined;
    const from = sp.get("from") || undefined;
    const to = sp.get("to") || undefined;
    const modeRaw = sp.get("mode") || undefined;

    if (statusRaw && isStatus(statusRaw)) next.status = statusRaw;
    if (deptRaw && isDept(deptRaw)) next.dept = deptRaw;
    if (from) next.from = from;
    if (to) next.to = to;
    if (modeRaw && isMode(modeRaw)) next.mode = modeRaw;

    if (Object.keys(next).length) onDraftChange(next);

    // snapshot current (same shape used in writer)
    const initPayload = {
      status: next.status ?? "",
      dept: next.dept ?? "",
      from: next.from ?? "",
      to: next.to ?? "",
      mode: next.mode ?? "",
    };
    lastRef.current = JSON.stringify(initPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write when draft changes (guarded)
  React.useEffect(() => {
    const payload = {
      status: draft.status ?? "",
      dept: draft.dept ?? "",
      from: draft.from ?? "",
      to: draft.to ?? "",
      mode: draft.mode ?? "",
    };
    const nextStr = JSON.stringify(payload);
    if (nextStr === lastRef.current) return;

    const base = searchParams?.toString() ?? "";
    const sp = new URLSearchParams(base);

    // Only write normalized values
    payload.status ? sp.set("status", payload.status) : sp.delete("status");
    payload.dept ? sp.set("dept", payload.dept) : sp.delete("dept");
    payload.from ? sp.set("from", payload.from) : sp.delete("from");
    payload.to ? sp.set("to", payload.to) : sp.delete("to");
    payload.mode ? sp.set("mode", payload.mode) : sp.delete("mode");

    lastRef.current = nextStr;
    router.replace(`${pathname}?${sp.toString()}`);
  }, [draft, pathname, router, searchParams]);

  return null;
}
