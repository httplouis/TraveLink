// src/app/admin/history/page.tsx
"use client";

import { useMemo, useState } from "react";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import HistoryStats from "@/components/admin/history/HistoryStats";
import HistoryFilters from "@/components/admin/history/HistoryFilters";
import HistoryTable from "@/components/admin/history/HistoryTable";
import HistoryDrawer from "@/components/admin/history/HistoryDrawer";
import ExportButton from "@/components/admin/history/ExportButton";
import { filterHistory, seedHistory, HistoryItem, HistoryQuery } from "@/lib/history";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 12;

export default function AdminHistoryPage() {
  // mock data (replace with server fetch in the future)
  const [data] = useState<HistoryItem[]>(() => seedHistory(140));
  const [query, setQuery] = useState<HistoryQuery>({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => filterHistory(data, query), [data, query]);

  const stats = useMemo(() => {
    const last7 = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return [
      { label: "Events (7 days)", value: data.filter(d => +new Date(d.ts) >= last7).length },
      { label: "Approvals (total)", value: data.filter(d => d.type === "Approval").length },
      { label: "Trip Requests (total)", value: data.filter(d => d.type === "Trip Request").length },
    ];
  }, [data]);

  // simulate slow filter (for feel)
  const onFilter = (q: HistoryQuery) => {
    setLoading(true);
    setQuery(q);
    setPage(1);
    setTimeout(() => setLoading(false), 220);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      {/* top bar */}
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <h1 className="text-base sm:text-lg font-semibold">Admin History</h1>
          <ExportButton rows={filtered} />
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-12 gap-4 md:gap-5">
        <AdminLeftNav />

        <section className="col-span-12 md:col-span-9 xl:col-span-9 2xl:col-span-9 grid gap-4 md:gap-5 min-w-0">
          <HistoryStats stats={stats} />

          <HistoryFilters
            query={query}
            onChange={onFilter}
            total={data.length}
            showing={filtered.length}
          />

          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
              </div>
            ) : (
              <HistoryTable
                rows={filtered}
                page={page}
                pageSize={PAGE_SIZE}
                onPage={setPage}
                onSelectRow={setSelected}
              />
            )}
          </div>
        </section>
      </main>

      <HistoryDrawer row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
