"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ScheduleFilterDraft = {
  status?: "All" | "Planned" | "InProgress" | "Completed" | "Cancelled";
  dept?: "All" | "CCMS" | "HR" | "Registrar" | "Finance";
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  mode?: "auto" | "apply";
};

const STATUS = ["All","Planned","InProgress","Completed","Cancelled"] as const;
const DEPT   = ["All","CCMS","HR","Registrar","Finance"] as const;
const MODE   = ["auto","apply"] as const;
const isIn = <T extends readonly string[]>(vs: T, v: string): v is T[number] => (vs as readonly string[]).includes(v);

type Props = { draft: ScheduleFilterDraft; onDraftChange: (n: Partial<ScheduleFilterDraft>) => void; };

export default function ScheduleURLSync({ draft, onDraftChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = React.useRef("");

  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();
    const next: Partial<ScheduleFilterDraft> = {};
    const status = sp.get("status") || undefined;
    const dept   = sp.get("dept") || undefined;
    const from   = sp.get("from") || undefined;
    const to     = sp.get("to") || undefined;
    const mode   = sp.get("mode") || undefined;

    if (status && isIn(STATUS, status)) next.status = status;
    if (dept && isIn(DEPT, dept)) next.dept = dept;
    if (from) next.from = from;
    if (to) next.to = to;
    if (mode && isIn(MODE, mode)) next.mode = mode;

    if (Object.keys(next).length) onDraftChange(next);
    lastRef.current = JSON.stringify({
      status: next.status ?? "", dept: next.dept ?? "", from: next.from ?? "", to: next.to ?? "", mode: next.mode ?? ""
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const payload = {
      status: draft.status ?? "", dept: draft.dept ?? "", from: draft.from ?? "", to: draft.to ?? "", mode: draft.mode ?? ""
    };
    const str = JSON.stringify(payload);
    if (str === lastRef.current) return;

    const base = searchParams?.toString() ?? "";
    const sp = new URLSearchParams(base);
    payload.status ? sp.set("status", payload.status) : sp.delete("status");
    payload.dept ? sp.set("dept", payload.dept) : sp.delete("dept");
    payload.from ? sp.set("from", payload.from) : sp.delete("from");
    payload.to ? sp.set("to", payload.to) : sp.delete("to");
    payload.mode ? sp.set("mode", payload.mode) : sp.delete("mode");

    lastRef.current = str;
    router.replace(`${pathname}?${sp.toString()}`);
  }, [draft, pathname, router, searchParams]);

  return null;
}
