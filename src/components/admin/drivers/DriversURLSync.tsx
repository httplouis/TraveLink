"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DriversFilterDraft = {
  status?: "All" | "Pending" | "Approved" | "Completed" | "Rejected";
  dept?: "All" | "CCMS" | "HR" | "Registrar" | "Finance";
  from?: string;
  to?: string;
  mode?: "auto" | "apply";
};

const STATUS = ["All","Pending","Approved","Completed","Rejected"] as const;
const DEPT   = ["All","CCMS","HR","Registrar","Finance"] as const;
const MODE   = ["auto","apply"] as const;
const isIn = <T extends readonly string[]>(vs: T, v: string): v is T[number] => (vs as readonly string[]).includes(v);

type Props = {
  draft: DriversFilterDraft;
  onDraftChange: (next: Partial<DriversFilterDraft>) => void;
};

function DriversURLSyncContent({ draft, onDraftChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = React.useRef<string>("");

  React.useEffect(() => {
    const sp = searchParams ?? new URLSearchParams();
    const next: Partial<DriversFilterDraft> = {};
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

export default function DriversURLSync(props: Props) {
  return (
    <React.Suspense fallback={null}>
      <DriversURLSyncContent {...props} />
    </React.Suspense>
  );
}
