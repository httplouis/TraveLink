"use client";

import * as React from "react";
import Toolbar from "../toolbar/Toolbar";
import FiltersBar from "../filters/FiltersBar.ui";
import MaintenanceKpiBar from "../kpi/MaintenanceKpiBar.ui";
import MaintenanceTable from "../ui/MaintenanceTable.ui";
import RecordDrawer from "../ui/RecordDrawer.ui";
import AttachmentLightbox from "../ui/AttachmentLightbox.ui";
import NewReportModal from "../forms/NewReportModal.ui";

import {
  MaintRepo,
  VehiclesRepo,
  DriverRepo,
  loadMaintenance,
  pushStatus,
  buildDemoRecords,





  
} from "@/lib/admin/maintenance";
import type {
  Attachment,
  MaintFilters,
  MaintRecord,
  MaintStatus,
} from "@/lib/admin/maintenance";

export default function MaintenancePage() {
  const vehicles = React.useMemo(() => VehiclesRepo.list(), []);
  const drivers = React.useMemo(() => DriverRepo.list(), []);

  const [filters, setFilters] = React.useState<MaintFilters>(() =>
    MaintRepo.loadFilters()
  );
  const [rows, setRows] = React.useState<MaintRecord[]>(() =>
    loadMaintenance(filters)
  );

  React.useEffect(() => {
    MaintRepo.saveFilters(filters);
    setRows(loadMaintenance(filters));
  }, [filters]);

  const [drawer, setDrawer] = React.useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [lightbox, setLightbox] = React.useState<{
    open: boolean;
    files: Attachment[];
    index: number;
  }>({ open: false, files: [], index: 0 });

  const [newOpen, setNewOpen] = React.useState(false);

  const current = rows.find((r) => r.id === drawer.id) || null;

  function handleStatus(id: string, next: MaintStatus) {
    try {
      pushStatus(id, next);
      setRows(loadMaintenance(filters));
    } catch (e) {
      alert(String(e));
    }
  }

  function seed() {
    const has = MaintRepo.list().length > 0;
    if (has && !confirm("Replace existing local data with demo records?")) return;
    const demo = buildDemoRecords(vehicles, drivers);
    MaintRepo.save(demo);
    setRows(loadMaintenance(filters));
  }

  function clearFilters() {
    setFilters({ q: "", types: [], statuses: [], density: filters.density });
  }

  function createRecord(rec: MaintRecord) {
    // Persist to local repo and refresh
    const all = MaintRepo.list();
    MaintRepo.save([rec, ...all]);
    setRows(loadMaintenance(filters));
  }

  return (
    <div className="p-4 md:p-6 space-y-4 bg-neutral-50 min-h-[calc(100vh-64px)]">
      <Toolbar
        title="Maintenance"
        subtitle="Admin • Maintenance"
        right={
          <div className="flex gap-2">
            <button
              onClick={() => setNewOpen(true)}
              className="px-3 py-1 rounded-lg bg-[#7a1f2a] text-white"
            >
              + New
            </button>
            <button
              onClick={seed}
              className="px-3 py-1 rounded-lg ring-1 ring-black/10 hover:bg-neutral-100"
            >
              Fill Mock Data
            </button>
          </div>
        }
      />

      <MaintenanceKpiBar rows={rows} />

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={clearFilters}
        onApply={() => setRows(loadMaintenance(filters))}
        onFillMock={seed}
      />

      <MaintenanceTable
        rows={rows}
        vehicles={vehicles}
        selection={[]}
        setSelection={() => {}}
        density={filters.density}
        onStatus={handleStatus}
        onOpen={({ id }) => setDrawer({ open: true, id })}
        onOpenLightbox={({ files, index }) => setLightbox({ open: true, files, index })}
      />

      <RecordDrawer
        open={drawer.open}
        row={current}
        vehicles={vehicles}
        drivers={drivers}
        onClose={() => setDrawer({ open: false, id: null })}
        onStatus={(next) => current && handleStatus(current.id, next)}
        onOpenLightbox={({ files, index }) => setLightbox({ open: true, files, index })}
      />

      <AttachmentLightbox
        open={lightbox.open}
        files={lightbox.files}
        index={lightbox.index}
        onClose={() => setLightbox({ open: false, files: [], index: 0 })}
      />

      <NewReportModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        vehicles={vehicles}
        drivers={drivers}
        onCreate={createRecord}
      />
    </div>
  );
}
