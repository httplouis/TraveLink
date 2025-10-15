// src/app/(protected)/admin/schedule/SchedulePageClient.tsx
"use client";

import * as React from "react";
import { ScheduleRepo } from "@/lib/admin/schedule/store";
import type { Schedule } from "@/lib/admin/schedule/types";
import { useHotkeys } from "@/lib/common/useHotkeys";

/* UI */
import ScheduleTable from "@/components/admin/schedule/ui/ScheduleTable.ui";
import ScheduleToolbar from "@/components/admin/schedule/toolbar/ScheduleToolbar.ui";
import ScheduleDetailsModal from "@/components/admin/schedule/ui/ScheduleDetailsModal.ui";
import KpiGrid from "@/components/admin/schedule/ui/KpiGrid.ui";

/* Filters / KPIs */
import { useScheduleFilters } from "@/components/admin/schedule/hooks/useScheduleFilters";
import { DEFAULT_SCH_FILTERS, filterSchedules } from "@/lib/admin/schedule/filters";
import { useScheduleKpis } from "@/components/admin/schedule/kpi/useScheduleKpis";

/* Create/Edit dialog — container only */
import CreateScheduleDialog from "@/components/admin/schedule/forms/CreateScheduleDialogs.container";

/* URL sync */
import ScheduleURLSync from "./ScheduleURLSync"; // q + sort only
import ScheduleFiltersURLSync from "@/components/admin/schedule/ScheduleFiltersURLSync"; // status/dept/from/to/mode

export default function SchedulePageClient() {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);

  // State
  const [rows, setRows] = React.useState<Schedule[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(15);
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [open, setOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<Schedule | null>(null);
  const [viewRow, setViewRow] = React.useState<Schedule | null>(null);

  const filters = useScheduleFilters(DEFAULT_SCH_FILTERS);
  const { kpis, refresh: refreshKpis } = useScheduleKpis();
   React.useEffect(() => {
    if (filters.draft.mode === "auto") {
      filters.apply();
    }
  }, [filters.draft, filters]);

  // Load repo after mount
  React.useEffect(() => {
    if (!hydrated) return;
    setRows(ScheduleRepo.list());
    refreshKpis();
  }, [hydrated, refreshKpis]);

  function refresh() {
    setRows(ScheduleRepo.list());
    refreshKpis();
  }

  const filtered = React.useMemo(() => {
    if (!hydrated) return [] as Schedule[];
    const base = filterSchedules(rows, { ...filters.applied, search: q });
    return [...base].sort((a, b) => {
      const tA = `${a.date}T${a.startTime}`;
      const tB = `${b.date}T${b.startTime}`;
      return sort === "newest" ? (tA < tB ? 1 : -1) : tA > tB ? 1 : -1;
    });
  }, [hydrated, rows, filters.applied, q, sort]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  const maxPage = React.useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  useHotkeys(
    [
      { key: "n", handler: () => { setEditRow(null); setOpen(true); } },
      {
        key: "Delete",
        handler: () => {
          if (!selected.size) return;
          ScheduleRepo.removeMany([...selected]);
          setSelected(new Set());
          refresh();
        },
      },
      { key: "x", handler: () => setSelected(new Set()) },
      {
        key: "a",
        handler: () => {
          const next = new Set<string>(selected);
          pageRows.forEach((r) => next.add(r.id));
          setSelected(next);
        },
      },
      { key: "ArrowLeft", handler: () => setPage((p) => Math.max(1, p - 1)) },
      { key: "ArrowRight", handler: () => setPage((p) => Math.min(maxPage, p + 1)) },
      { key: "t", handler: () => setSort((s) => (s === "newest" ? "oldest" : "newest")) },
    ],
    { ignoreWhileTyping: true }
  );

  const onToggleOne = (id: string, checked: boolean) =>
    setSelected((p) => {
      const n = new Set(p);
      checked ? n.add(id) : n.delete(id);
      return n;
    });

  const onToggleAll = (checked: boolean) =>
    setSelected(() => {
      const n = new Set<string>();
      if (checked) pageRows.forEach((r) => n.add(r.id));
      return n;
    });

  if (!hydrated) {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4">
              <div className="h-4 w-28 animate-pulse rounded bg-neutral-200" />
              <div className="mt-2 h-8 w-12 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="mb-3 h-6 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="h-48 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* URL sync for q/sort */}
      <ScheduleURLSync q={q} sort={sort} onQ={setQ} onSort={setSort} />
      {/* URL sync for filters (status/dept/from/to/mode) */}
      <ScheduleFiltersURLSync draft={filters.draft} onDraftChange={(patch) => filters.update(patch)} />

      {/* KPI cards */}
      <KpiGrid kpis={kpis} />

      <ScheduleTable
        rows={pageRows}
        pagination={{ page, pageSize, total }}
        selected={selected}
        onToggleOne={onToggleOne}
        onToggleAll={onToggleAll}
        onEdit={(r: Schedule) => {
          setEditRow(r);
          setOpen(true);
        }}
        onDeleteMany={(ids: string[]) => {
          ScheduleRepo.removeMany(ids);
          setSelected(new Set());
          refresh();
        }}
        onSetStatus={(id: string, s: Schedule["status"]) => {
          try {
            ScheduleRepo.setStatus(id, s);
            refresh();
          } catch (e: any) {
            alert(e?.message || "Cannot change status");
          }
        }}
        onPageChange={(nextPage: number) => setPage(nextPage)}
        onView={(r: Schedule) => setViewRow(r)}
        toolbar={
          <ScheduleToolbar
            q={q}
            onQChange={(v: string) => {
              setQ(v);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(s: "newest" | "oldest") => {
              setSort(s);
              setPage(1);
            }}
            onAddNew={() => {
              setEditRow(null);
              setOpen(true);
            }}
            draft={filters.draft}
            onDraftChange={(n) => {
              filters.update(n);
              setPage(1);
            }}
            onApply={() => {
              filters.apply();
              setPage(1);
            }}
            onClearAll={() => {
              filters.clearAll();
              setPage(1);
            }}
          />
        }
      />

      <CreateScheduleDialog
        open={open}
        initial={editRow ?? undefined}
        onClose={() => setOpen(false)}
        onSubmit={(data) => {
          try {
            if (editRow) {
              ScheduleRepo.update(editRow.id, data);
            } else {
              ScheduleRepo.create(data);
            }
            setOpen(false);
            refresh();
          } catch (err: any) {
            alert(err?.message || "Cannot save schedule.");
          }
        }}
      />

      <ScheduleDetailsModal
        open={!!viewRow}
        data={viewRow || undefined}
        onClose={() => setViewRow(null)}
      />
    </div>
  );
}
