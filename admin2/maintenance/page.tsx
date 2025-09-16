"use client";

import { useMemo, useState } from "react";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import MaintenanceToolbar from "@/components/admin/maintenance/MaintenanceToolbar";
import MaintenanceFilters from "@/components/admin/maintenance/MaintenanceFilters";
import MaintenanceTable from "@/components/admin/maintenance/MaintenanceTable";
import MaintenanceBoard from "@/components/admin/maintenance/MaintenanceBoard";
import MaintenanceDrawer from "@/components/admin/maintenance/MaintenanceDrawer";
import MaintenanceFormModal, { MaintenanceFormValues } from "@/components/admin/maintenance/MaintenanceFormModal";
import MaintenanceStats from "@/components/admin/maintenance/MaintenanceStats";
import MaintenanceBulkBar from "@/components/admin/maintenance/MaintenanceBulkBar";

import {
  MaintenanceQuery,
  MaintenanceTicket,
  MaintVehicle,
  ServiceState,
  advanceMaintStatus,
  exportMaintenanceCSV,
  filterMaintenanceTickets,
  seedMaintVehicles,
  seedMaintenanceTickets,
  updateVehicleServiceState,
} from "@/lib/maintenanceDomain";
import { Loader2 } from "lucide-react";

const BRAND = "#7A0010";
const PAGE_SIZE = 12;

export default function AdminMaintenancePage() {
  const [view, setView] = useState<"table" | "board">("table");
  const [vehicles, setVehicles] = useState<MaintVehicle[]>(() => seedMaintVehicles(18));
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => seedMaintenanceTickets(vehicles, 40));

  const [query, setQuery] = useState<MaintenanceQuery>({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState<MaintenanceTicket | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => filterMaintenanceTickets(tickets, query, vehicles), [tickets, query, vehicles]);

  const stats = useMemo(() => {
    return [
      { label: "Open", value: tickets.filter(t => t.status !== "Completed").length, sub: "All campuses" },
      { label: "Out of Service", value: vehicles.filter(v => v.serviceState === "Out of Service").length, sub: "Vehicles" },
      { label: "Critical", value: tickets.filter(t => t.severity === "Critical").length, sub: "Needs urgent action" },
    ];
  }, [tickets, vehicles]);

  const onFilter = (q: MaintenanceQuery) => {
    setLoading(true);
    setQuery(q);
    setPage(1);
    setTimeout(() => setLoading(false), 180);
  };

  const onAdvance = (id: string) => {
    setTickets((arr) => arr.map(t => t.id === id ? { ...t, status: advanceMaintStatus(t.status), updatedAt: new Date().toISOString() } : t));
    setDrawer((d) => d && d.id === id ? { ...d, status: advanceMaintStatus(d.status), updatedAt: new Date().toISOString() } : d);
  };

  const onToggleOOS = (vehicleId: string, state: ServiceState) => {
    setVehicles((vs) => updateVehicleServiceState(vs, vehicleId, state));
  };

  const onUpdateTicket = (id: string, patch: Partial<MaintenanceTicket>) => {
    setTickets((arr) => arr.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t));
    setDrawer((d) => d && d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d);
  };

  const onDeleteTicket = (id: string) => {
    setTickets((arr) => arr.filter(t => t.id !== id));
    setSelectedIds((s) => {
      const n = new Set(s); n.delete(id); return n;
    });
    setDrawer(null);
  };

  const onSetDue = (id: string, iso?: string) => onUpdateTicket(id, { dueDate: iso });
  const onSetCost = (id: string, cost?: number) => onUpdateTicket(id, { cost });

  const onNewSubmit = (v: MaintenanceFormValues) => {
    const t: MaintenanceTicket = {
      id: `MT-${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      campus: v.campus,
      vehicleId: v.vehicleId,
      title: v.title,
      description: v.description || "—",
      severity: v.severity,
      status: "Reported",
      reporter: "System (Admin)",
      dueDate: v.dueDate,
      markOutOfService: v.markOutOfService,
    };
    setTickets((arr) => [t, ...arr]);
    if (v.markOutOfService) {
      setVehicles((vs) => updateVehicleServiceState(vs, v.vehicleId, "Out of Service"));
    }
    setFormOpen(false);
  };

  const selectedRows = useMemo(() => tickets.filter(r => selectedIds.has(r.id)), [tickets, selectedIds]);

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

  const completeMany = (ids: string[]) => {
    setTickets((arr) => arr.map(t => ids.includes(t.id) ? { ...t, status: "Completed", updatedAt: new Date().toISOString() } : t));
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <header className="sticky top-0 z-30 w-full border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white" style={{ background: BRAND }}>
              M
            </div>
            <h1 className="text-base sm:text-lg font-semibold">Admin Maintenance</h1>
            <p className="text-sm text-neutral-500 hidden md:block truncate">Track vehicle issues, assignments, and downtime.</p>
          </div>

          {/* Export all filtered */}
          <button
            onClick={() => {
              const csv = exportMaintenanceCSV(filtered, vehicles);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `travilink-maintenance-${new Date().toISOString().slice(0,10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-white shadow-sm"
            style={{ background: BRAND }}
            title="Export current rows to CSV"
          >
            Export CSV
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-12 gap-4 md:gap-5">
        <AdminLeftNav />

        <section className="col-span-12 md:col-span-9 xl:col-span-9 grid gap-4 md:gap-5 min-w-0">
          <MaintenanceStats stats={[
            { label: "Open", value: stats[0].value, sub: stats[0].sub },
            { label: "Out of Service", value: stats[1].value, sub: stats[1].sub },
            { label: "Critical", value: stats[2].value, sub: stats[2].sub },
          ]} />

          <MaintenanceToolbar
            view={view}
            onView={setView}
            onNew={() => setFormOpen(true)}
          />

          <MaintenanceFilters
            total={tickets.length}
            showing={filtered.length}
            query={query}
            onChange={onFilter}
          />

          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
              </div>
            ) : view === "table" ? (
              <MaintenanceTable
                rows={filtered}
                vehicles={vehicles}
                page={page}
                pageSize={PAGE_SIZE}
                onPage={setPage}
                onRow={setDrawer}
                onAdvance={onAdvance}
                onToggleOOS={onToggleOOS}
                onSetDue={onSetDue}
                onSetCost={onSetCost}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
                onToggleSelectAll={onToggleSelectAll}
              />
            ) : (
              <MaintenanceBoard
                rows={filtered}
                onOpen={setDrawer}
                onAdvance={onAdvance}
              />
            )}
          </div>
        </section>
      </main>

      <MaintenanceBulkBar
        selected={selectedRows}
        vehicles={vehicles}
        onClear={() => setSelectedIds(new Set())}
        onCompleteMany={completeMany}
      />

      <MaintenanceDrawer
        row={drawer}
        vehicles={vehicles}
        onClose={() => setDrawer(null)}
        onAdvance={onAdvance}
        onToggleOOS={onToggleOOS}
        onUpdate={onUpdateTicket}
        onDelete={onDeleteTicket}
      />

      <MaintenanceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={onNewSubmit}
        vehicles={vehicles}
      />
    </div>
  );
}
