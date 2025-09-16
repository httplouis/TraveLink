// src/components/admin/requests/containers/FiltersBar.container.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FilterState, RequestRow } from "@/lib/admin/types";

/** Default filter values */
const DEFAULTS: FilterState = {
  status: "All",
  dept: "All",
  search: "",
  from: "",
  to: "",
  mode: "auto",
};

function parseParams(sp: URLSearchParams): FilterState {
  return {
    status: (sp.get("status") as FilterState["status"]) || "All",
    dept: (sp.get("dept") as FilterState["dept"]) || "All",
    from: sp.get("from") || "",
    to: sp.get("to") || "",
    search: sp.get("search") || "",
    mode: (sp.get("mode") as FilterState["mode"]) || "auto",
  };
}

export type FiltersControls = {
  draft: FilterState;
  onDraftChange: (next: Partial<FilterState>) => void;
  onApply: () => void;
  onClearAll: () => void;
  resultCount: number;
};

export default function FiltersBarContainer({
  rows,
  onFiltered,
  children,
}: {
  rows: RequestRow[];
  onFiltered: (filtered: RequestRow[]) => void;
  /** Optional render-prop so we can place the Filter button wherever we like (e.g. next to Search) */
  children?: (controls: FiltersControls) => React.ReactNode;
}) {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : (new URLSearchParams() as any);

  const mounted = useRef(false);

  // init from URL (or defaults)
  const [applied, setApplied] = useState<FilterState>(() => parseParams(searchParams) || DEFAULTS);
  const [draft, setDraft] = useState<FilterState>(() => parseParams(searchParams) || DEFAULTS);

  // compute filtered rows
  const filtered = useMemo(() => filterRows(rows ?? [], applied), [rows, applied]);

  // push to parent on change
  useEffect(() => {
    if (!mounted.current) return;
    onFiltered(filtered);
  }, [filtered, onFiltered]);

  // initial mount: notify parent and mark mounted
  useEffect(() => {
    onFiltered(filtered);
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saved Views events (headless; UI handled where button is rendered)
  useEffect(() => {
    function saveView() {
      try {
        const views: Array<{ name: string; state: FilterState }> = JSON.parse(localStorage.getItem("tl.requests.views") || "[]");
        const name = window.prompt("Save filters as…", "My Dept Pending");
        if (!name) return;
        const next = [...views.filter((v) => v.name !== name), { name, state: applied }];
        localStorage.setItem("tl.requests.views", JSON.stringify(next));
        window.dispatchEvent(new StorageEvent("storage", { key: "tl.requests.views", newValue: JSON.stringify(next) }));
      } catch {
        // ignore
      }
    }
    function applyView(e: Event) {
      try {
        const name = (e as CustomEvent<string>).detail;
        const views: Array<{ name: string; state: FilterState }> = JSON.parse(localStorage.getItem("tl.requests.views") || "[]");
        const found = views.find((v) => v.name === name);
        if (found) {
          setDraft(found.state);
          setApplied(found.state);
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener("requests.saveView", saveView as any);
    window.addEventListener("requests.applyView", applyView as any);
    return () => {
      window.removeEventListener("requests.saveView", saveView as any);
      window.removeEventListener("requests.applyView", applyView as any);
    };
  }, [applied]);

  function onDraftChange(next: Partial<FilterState>) {
    const nextDraft = { ...draft, ...next };
    setDraft(nextDraft);
    if (nextDraft.mode === "auto") setApplied(nextDraft); // realtime apply
  }
  function onApply() {
    setApplied(draft);
  }
  function onClearAll() {
    setDraft(DEFAULTS);
    setApplied(DEFAULTS);
  }

  if (children) {
    return <>{children({ draft, onDraftChange, onApply, onClearAll, resultCount: filterRows(rows ?? [], draft).length })}</>;
  }
  // Headless by default (no UI). We place the button next to Search in the table toolbar.
  return null;
}

function filterRows(rows: RequestRow[], f: FilterState): RequestRow[] {
  return (rows ?? []).filter((r) => {
    const okStatus = f.status === "All" || r.status === f.status;
    const okDept = f.dept === "All" || r.dept === f.dept;
    const q = (f.search ?? "").trim().toLowerCase();
    const okSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q) ||
      r.dept.toLowerCase().includes(q) ||
      (r.requester ?? "").toLowerCase().includes(q) ||
      (r.driver ?? "").toLowerCase().includes(q) ||
      (r.vehicle ?? "").toLowerCase().includes(q);
    const okFrom = !f.from || r.date >= f.from;
    const okTo = !f.to || r.date <= f.to;
    return okStatus && okDept && okSearch && okFrom && okTo;
  });
}
