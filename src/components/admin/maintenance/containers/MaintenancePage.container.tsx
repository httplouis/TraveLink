"use client";

import * as React from "react";
import Toolbar from "../toolbar/Toolbar";
import FiltersBar from "../filters/FiltersBar.ui";
import MaintenanceKpiBar from "../kpi/MaintenanceKpiBar.ui";
import MaintenanceTable from "../ui/MaintenanceTable.ui";
import RecordDrawer from "../ui/RecordDrawer.ui";
import AttachmentLightbox from "../ui/AttachmentLightbox.ui";
import AttachmentsGrid from "../ui/AttachmentsGrid.ui";
import NewReportModal from "../forms/NewReportModal.ui";

import {
  MaintRepo,
  VehiclesRepo,
  DriverRepo,
  loadMaintenance,
  pushStatus,
} from "@/lib/admin/maintenance";
import type {
  Attachment,
  MaintFilters,
  MaintRecord,
  MaintStatus,
  Vehicle,
  Driver,
} from "@/lib/admin/maintenance";

export default function MaintenancePage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<MaintFilters>(() =>
    MaintRepo.loadFilters()
  );
  const [rows, setRows] = React.useState<MaintRecord[]>([]);

  // Fetch data on mount
  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch vehicles, drivers, and maintenance records from Supabase
        const [vehiclesData, driversData, maintenanceData] = await Promise.all([
          VehiclesRepo.list(),
          DriverRepo.list(),
          MaintRepo.list(),
        ]);
        
        setVehicles(vehiclesData);
        setDrivers(driversData);
        
        // Update local cache with fetched data
        if (maintenanceData.length > 0) {
          MaintRepo.save(maintenanceData);
        }
        
        // Apply filters
        setRows(loadMaintenance(filters));
      } catch (error) {
        console.error('[MaintenancePage] Error fetching data:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

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
  const [activeTab, setActiveTab] = React.useState<"table" | "library">("table");

  const current = rows.find((r) => r.id === drawer.id) || null;
  
  // Collect all attachments from all maintenance records for library view
  const allAttachments = React.useMemo(() => {
    const attachments: Array<{ record: MaintRecord; attachment: any; index: number }> = [];
    rows.forEach((record) => {
      if (record.attachments && Array.isArray(record.attachments)) {
        record.attachments.forEach((att, index) => {
          attachments.push({ record, attachment: att, index });
        });
      }
    });
    return attachments;
  }, [rows]);

  async function handleStatus(id: string, next: MaintStatus) {
    try {
      await pushStatus(id, next);
      // Refresh from API
      const updated = await MaintRepo.list();
      MaintRepo.save(updated);
      setRows(loadMaintenance(filters));
    } catch (e) {
      console.error('[handleStatus] Error:', e);
      alert(`Failed to update status: ${String(e)}`);
    }
  }

  function clearFilters() {
    setFilters({ q: "", types: [], statuses: [], density: filters.density });
  }

  async function createRecord(rec: MaintRecord) {
    try {
      // Sync with API
      await MaintRepo.upsert(rec);
      // Refresh from API
      const updated = await MaintRepo.list();
      MaintRepo.save(updated);
      setRows(loadMaintenance(filters));
    } catch (error) {
      console.error('[createRecord] Error:', error);
      alert(`Failed to save maintenance record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4 bg-neutral-50 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a1f2a]"></div>
          <p className="mt-2 text-neutral-600">Loading maintenance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-neutral-50 to-neutral-100 min-h-[calc(100vh-64px)]">
      <Toolbar
        title="Maintenance"
        subtitle="Admin • Maintenance"
        right={
          <button
            onClick={() => setNewOpen(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7a1f2a] to-[#9a2f3a] text-white hover:from-[#6a1a24] hover:to-[#8a1f2a] transition-all shadow-md hover:shadow-lg font-medium"
          >
            + New Maintenance
          </button>
        }
      />

      <MaintenanceKpiBar rows={rows} />

      <FiltersBar
        value={filters}
        onChange={setFilters}
        onClear={clearFilters}
        onApply={() => setRows(loadMaintenance(filters))}
      />

      {/* Tabs for Table and Library */}
      <div className="bg-white rounded-xl shadow-md border border-neutral-200">
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab("table")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "table"
                ? "text-[#7a1f2a] border-b-2 border-[#7a1f2a] bg-[#7a1f2a]/5"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === "library"
                ? "text-[#7a1f2a] border-b-2 border-[#7a1f2a] bg-[#7a1f2a]/5"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Document Library ({allAttachments.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === "table" ? (
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
          ) : (
            <div className="space-y-6">
              {allAttachments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📁</div>
                  <p className="text-neutral-600 font-medium">No documents found</p>
                  <p className="text-sm text-neutral-400 mt-2">Upload documents in maintenance records to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      All Maintenance Documents ({allAttachments.length})
                    </h3>
                    <div className="text-sm text-neutral-500">
                      From {rows.length} maintenance record{rows.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allAttachments.map(({ record, attachment, index }) => (
                      <div
                        key={`${record.id}-${index}`}
                        className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setDrawer({ open: true, id: record.id });
                          setTimeout(() => {
                            setLightbox({ open: true, files: record.attachments || [], index });
                          }, 300);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {attachment.mime?.startsWith("image/") ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-neutral-100 rounded border flex items-center justify-center text-xs text-neutral-600">
                              No Image
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {attachment.name || "Untitled"}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {record.type} • {record.vehicleId ? vehicles.find(v => v.id === record.vehicleId)?.vehicle_name || vehicles.find(v => v.id === record.vehicleId)?.name || "Unknown Vehicle" : "General"}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.nextDueDate ? new Date(record.nextDueDate).toLocaleDateString() : "No date"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
