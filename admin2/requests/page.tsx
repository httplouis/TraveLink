"use client";

import { useMemo, useState } from "react";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import RequestsFilters from "@/components/admin/requests/RequestsFilters";
import RequestsTable from "@/components/admin/requests/RequestsTable";
import RequestsBulkBar from "@/components/admin/requests/RequestsBulkBar";
import RequestDrawer from "@/components/admin/requests/RequestDrawer";
import { RequestItem, RequestsQuery, filterRequests, seedRequests } from "@/lib/requests";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

export default function AdminRequestsPage() {
  const [data, setData] = useState<RequestItem[]>(() => seedRequests(90));
  const [query, setQuery] = useState<RequestsQuery>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState<RequestItem | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterRequests(data, query), [data, query]);

  const onFilter = (q: RequestsQuery) => {
    setLoading(true);
    setQuery(q);
    setPage(1);
    setTimeout(() => setLoading(false), 220);
  };

  // Approve / Reject simulate
  const setStatus = (id: string, status: "Approved" | "Rejected") => {
    setData((rows) => rows.map(r => r.id === id ? { ...r, status } : r));
    setDrawer((d) => (d && d.id === id ? { ...d, status } : d));
  };

  const onApprove = (id: string) => setStatus(id, "Approved");
  const onReject  = (id: string) => setStatus(id, "Rejected");

  const onToggleSelect = (id: string) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const onToggleSelectAll = (ids: string[]) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      const allIn = ids.every(id => n.has(id));
      ids.forEach(id => allIn ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const selectedRows = useMemo(() => data.filter(r => selectedIds.has(r.id)), [data, selectedIds]);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <h1 className="text-base sm:text-lg font-semibold">Admin Requests</h1>
          {/* (Optional) Add a "New request" here in future */}
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-12 gap-4 md:gap-5">
        <AdminLeftNav />

        <section className="col-span-12 md:col-span-9 xl:col-span-9 grid gap-4 md:gap-5 min-w-0">
          <RequestsFilters
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
              <RequestsTable
                rows={filtered}
                page={page}
                pageSize={PAGE_SIZE}
                onPage={setPage}
                onSelectRow={setDrawer}
                onApprove={onApprove}
                onReject={onReject}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onToggleSelectAll={onToggleSelectAll}
              />
            )}
          </div>
        </section>
      </main>

      <RequestsBulkBar selected={selectedRows} onClear={() => setSelectedIds(new Set())} />
      <RequestDrawer row={drawer} onClose={() => setDrawer(null)} onApprove={onApprove} onReject={onReject} />
    </div>
  );
}
