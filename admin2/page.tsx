"use client";
import React, { useMemo, useRef, useState } from "react";
import "@/app/styles/admin.css";

import Header from "@/components/common/Header";
import LeftNav from "@/components/admin/LeftNav";
import NotificationHub from "@/components/admin/NotificationHub";
import RightRail from "@/components/admin/RightRail";
import CTA from "@/components/ui/Button";
import VehicleCard from "@/components/admin/VehicleCard";
import AddVehicleCard from "@/components/admin/AddVehicleCard";
import DriverCard from "@/components/admin/DriverCard";
import Badge from "@/components/ui/Badge";
import LogoutButton from "@/components/auth/LogoutButton";





import type {
  Driver,
  DriverStatus,
  Notif,
  Schedule,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "@/lib/travilink";

/* ======= seeds ======= */
const seedVehicles: Vehicle[] = [
  { id: "v1", name: "Bus 1", type: "Bus", status: "available" },
  { id: "v2", name: "Van 1", type: "Van", status: "maintenance", note: "Under maintenance" },
  { id: "v3", name: "Bus 2", type: "Bus", status: "available" },
  { id: "v4", name: "Car 3", type: "Car", status: "available" },
  { id: "v5", name: "Bus 3", type: "Bus", status: "available" },
];

const schedules: Schedule[] = [
  { id: "s1", dept: "Hans / CCMS", purpose: "Seminar event", date: "2025-12-25", location: "Tagaytay", vehicle: "Bus", driver: "Jolo Rosales", status: "Approved" },
  { id: "s2", dept: "HR / MAIN", purpose: "Campus tour", date: "2025-12-28", location: "MSEUF Lucena", vehicle: "Van", status: "Pending" },
  { id: "s3", dept: "ENG / ME", purpose: "Field trip", date: "2026-01-10", location: "Batangas", vehicle: "Bus", status: "Assigned" },
  { id: "s4", dept: "Registrar", purpose: "Docs run", date: "2026-01-12", location: "City Hall", vehicle: "Car", status: "Pending" },
];

const seedDrivers: Driver[] = [
  { id: "d1", name: "Jolo Rosales", license: "Professional", vehicleTypes: ["Bus"], status: "available", phone: "09xx-xxx-xxxx", color: "#7A0010" },
  { id: "d2", name: "Mara Santos", license: "Professional", vehicleTypes: ["Van", "Car"], status: "on_trip", phone: "09xx-xxx-xxxx", color: "#0E7490" },
  { id: "d3", name: "Ken Alvarez", license: "Non-Prof", vehicleTypes: ["Car"], status: "off_duty", phone: "09xx-xxx-xxxx", color: "#4F46E5" },
  { id: "d4", name: "Ivy Dela Cruz", license: "Professional", vehicleTypes: ["Bus", "Van"], status: "available", phone: "09xx-xxx-xxxx", color: "#16A34A" },
  { id: "d5", name: "Rico Medina", license: "Professional", vehicleTypes: ["Van"], status: "sick", phone: "09xx-xxx-xxxx", color: "#EA580C" },
];

const seedNotifs: Notif[] = [
  { id: "n1", type: "request", title: "New trip request", body: "ENG/ME Field trip on Jan 10 needs approval.", time: "2m", unread: true },
  { id: "n2", type: "maintenance", title: "Van 1 flagged for maintenance", body: "Reported by depot", time: "1h", unread: true, severity: "warning" },
  { id: "n3", type: "driver", title: "Driver on leave", body: "Ken Alvarez is marked On Leave tomorrow.", time: "3h", unread: false },
  { id: "n4", type: "system", title: "Export finished", body: "CSV export of schedules is ready.", time: "Today", unread: false, severity: "info" },
  { id: "n5", type: "request", title: "Pending approval aging", body: "2 requests pending > 24h.", time: "Yesterday", unread: true, severity: "danger" },
  { id: "n6", type: "driver", title: "New driver added", body: "Ivy Dela Cruz was added.", time: "Mon", unread: false },
];

/* ======= mock API ======= */
async function postVehicleStatus(_vehicleId: string, _status: VehicleStatus) { try {} catch (e) {} }
async function deleteVehicleOnServer(_vehicleId: string) { try {} catch (e) {} }

const APP_SCALE = 1.1;


export default function AdminDashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(seedVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(seedDrivers);

  /* notifications */
  const [notifs, setNotifs] = useState<Notif[]>(seedNotifs);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useMemo(() => notifs.filter((n) => n.unread).length, [notifs]);
  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  const clearOne = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id));
  const clearAll = () => setNotifs([]);

  /* vehicles */
  const setStatus = async (id: string, status: VehicleStatus) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status, note: status === "available" ? undefined : status === "maintenance" ? "Under maintenance" : "Offline" }
          : v
      )
    );
    await postVehicleStatus(id, status);
  };

  const addVehicle = (v: Vehicle) => setVehicles((prev) => [v, ...prev]);

  const removeVehicle = async (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id)); // optimistic
    await deleteVehicleOnServer(id);
    setNotifs((prev) => [
      { id: "n" + Math.random().toString(36).slice(2, 8), type: "system", title: "Vehicle removed", body: `Vehicle ${id} was removed.`, time: "Now", unread: true },
      ...prev,
    ]);
  };

  /* drivers */
  const updateDriverStatus = (id: string, status: DriverStatus) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  /* add driver form state */
  const [showAdd, setShowAdd] = useState(false);
  const [newDriver, setNewDriver] = useState<Partial<Driver>>({
    name: "",
    license: "Professional",
    vehicleTypes: ["Bus"],
    status: "available",
    phone: "",
    color: "#7A0010",
  });

  const addDriver = () => {
    if (!newDriver.name?.trim()) return;
    const id = "d" + Math.random().toString(36).slice(2, 8);
    setDrivers((prev) => [
      {
        id,
        name: newDriver.name!.trim(),
        license: (newDriver.license as string) || "Professional",
        vehicleTypes: (newDriver.vehicleTypes as VehicleType[]) || ["Bus"],
        status: (newDriver.status as DriverStatus) || "available",
        phone: newDriver.phone || "",
        color: newDriver.color || "#7A0010",
      },
      ...prev,
    ]);
    setShowAdd(false);
    setNewDriver({ name: "", license: "Professional", vehicleTypes: ["Bus"], status: "available", phone: "", color: "#7A0010" });
  };

  const toggleVehicleType = (vt: VehicleType) => {
    setNewDriver((prev) => {
      const set = new Set(prev.vehicleTypes as VehicleType[]);
      set.has(vt) ? set.delete(vt) : set.add(vt);
      return { ...prev, vehicleTypes: Array.from(set) };
    });
  };

  /* horizontal scroll */
  const rowRef = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dir: "left" | "right") => {
    const el = rowRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  /* scale wrapper */
  const APP_SCALE = 1.1;
  const scaleStyles: React.CSSProperties = {
    transform: `scale(${APP_SCALE})`,
    transformOrigin: "top left",
    width: `${100 / APP_SCALE}%`,
    height: `${100 / APP_SCALE}%`,
  };

  return (
    
    <div
      data-role="admin"
      className="h-screen overflow-hidden text-neutral-900"
      style={{
        background:
          "radial-gradient(1200px 600px at 100% -10%, rgba(122,0,16,0.06), transparent 60%), radial-gradient(900px 600px at -10% 110%, rgba(122,0,16,0.06), transparent 55%), #fafafa",
      }}
    >
      <style jsx global>{`footer, [role="contentinfo"] { display: none !important; }`}</style>

      <div style={scaleStyles} className="h-full">
        <Header onToggleNotifs={() => setNotifOpen((o) => !o)} unread={unread} notifOpen={notifOpen} />

        
        
        <main
          className="min-h-0 w-full px-2 sm:px-4 py-3 grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 overflow-hidden"
          style={{ height: "calc(100% - 52px)" }}
        >
          <LeftNav />

          {/* CENTER — the ONLY scroller */}
          <section className="col-span-12 md:col-span-8 xl:col-span-8 2xl:col-span-7 overflow-y-auto min-h-0 pr-1 pt-2">
            {/* sticky actions */}
            <div className="sticky top-0 z-10 -mx-1 px-1 pb-2 bg-gradient-to-b from-white/85 to-white/60 backdrop-blur border-b border-neutral-200/70">
              <div className="flex flex-wrap items-center gap-2">
                <CTA tone="primary">Submit a request</CTA>
                <CTA tone="ghost">Assign Driver</CTA>
                <CTA tone="ghost">Open Tracker</CTA>
              </div>
            </div>

            {/* vehicle row */}
            <div className="relative mt-3 -mx-1 px-1">
              <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[#fafafa] to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[#fafafa] to-transparent" />
              <button
                aria-label="Scroll left"
                onClick={() => scrollBy("left")}
                className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-neutral-200 shadow items-center justify-center transition-colors hover:bg-neutral-50"
              >
                ‹
              </button>
              <button
                aria-label="Scroll right"
                onClick={() => scrollBy("right")}
                className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/90 border border-neutral-200 shadow items-center justify-center transition-colors hover:bg-neutral-50"
              >
                ›
              </button>

              <div ref={rowRef} className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible pb-6 snap-x snap-mandatory scroll-smooth">
                <AddVehicleCard onAdd={addVehicle} />
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} v={v} onStatus={setStatus} onRemove={removeVehicle} />
                ))}
              </div>
            </div>

            {/* schedules + drivers */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 mt-3">
              {/* Upcoming Schedules */}
              <div className="xl:col-span-7 rounded-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-white/60 backdrop-blur rounded-t-xl">
                  <h2 className="text-sm font-semibold">Upcoming Schedules</h2>
                  <div className="flex items-center gap-2">
                    <CTA tone="ghost" className="px-3 py-1.5">Export</CTA>
                    <CTA tone="primary" className="px-3 py-1.5">New Request</CTA>
                  </div>
                </div>

                <div className="max-h-[520px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur">
                      <tr className="[&>th]:px-3 [&>th]:py-2 text-neutral-600 text-left">
                        <th>Name/Department</th>
                        <th>Purpose</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Vehicle</th>
                        <th>Driver</th>
                        <th>Status</th>
                        <th className="text-right pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {schedules.map((s, i) => (
                        <tr key={s.id} className={`transition-colors hover:bg-neutral-100/60 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50/60"}`}>
                          <td className="px-3 py-2">{s.dept}</td>
                          <td className="px-3 py-2">{s.purpose}</td>
                          <td className="px-3 py-2">{s.date}</td>
                          <td className="px-3 py-2">{s.location}</td>
                          <td className="px-3 py-2">{s.vehicle}</td>
                          <td className="px-3 py-2">{s.driver ?? "—"}</td>
                          <td className="px-3 py-2">
                            {s.status === "Approved" && <Badge color="green">Approved</Badge>}
                            {s.status === "Pending" && <Badge color="amber">Pending</Badge>}
                            {s.status === "Assigned" && <Badge color="blue">Assigned</Badge>}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1 justify-end">
                              <CTA tone="ghost" className="px-2.5 py-1.5">Assign</CTA>
                              <CTA tone="success" className="px-2.5 py-1.5">Approve</CTA>
                              <CTA tone="danger" className="px-2.5 py-1.5">Reject</CTA>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drivers */}
              <div className="xl:col-span-5 rounded-xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 shadow-sm flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="px-3 py-2 border-b border-neutral-200 bg-white/60 backdrop-blur rounded-t-xl flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Drivers</h2>
                  <CTA tone="primary" className="px-3 py-1.5" onClick={() => setShowAdd((s) => !s)}>
                    {showAdd ? "Close" : "Add Driver"}
                  </CTA>
                </div>

                {showAdd && (
                  <div className="px-3 pt-3 space-y-2 border-b border-neutral-100 bg-neutral-50/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                        placeholder="Full name"
                        value={newDriver.name ?? ""}
                        onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
                      />
                      <input
                        className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                        placeholder="Phone (optional)"
                        value={newDriver.phone ?? ""}
                        onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                        value={newDriver.license as string}
                        onChange={(e) => setNewDriver({ ...newDriver, license: e.target.value })}
                      >
                        <option>Professional</option>
                        <option>Non-Prof</option>
                      </select>

                      <select
                        className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                        value={newDriver.status as string}
                        onChange={(e) => setNewDriver({ ...newDriver, status: e.target.value as DriverStatus })}
                      >
                        <option value="available">Available</option>
                        <option value="on_trip">On Trip</option>
                        <option value="off_duty">Off Duty</option>
                        <option value="sick">Sick</option>
                        <option value="leave">On Leave</option>
                      </select>

                      <input
                        type="color"
                        title="Avatar color"
                        className="h-9 rounded-md border border-neutral-200 bg-white px-1 text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
                        value={newDriver.color as string}
                        onChange={(e) => setNewDriver({ ...newDriver, color: e.target.value })}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {(["Bus", "Van", "Car"] as VehicleType[]).map((vt) => {
                        const active = (newDriver.vehicleTypes as VehicleType[] | undefined)?.includes(vt);
                        return (
                          <button
                            key={vt}
                            type="button"
                            className={`px-3 py-1.5 rounded-full text-sm ring-1 focus:outline-none focus:ring-2 focus:ring-[#7A0010] transition-colors ${
                              active ? "bg-neutral-900 text-white ring-neutral-900" : "bg-white text-neutral-800 ring-neutral-200 hover:bg-neutral-50"
                            }`}
                            onClick={() => toggleVehicleType(vt)}
                          >
                            {vt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pb-3">
                      <CTA tone="primary" className="px-3.5 py-1.5" onClick={addDriver}>
                        Save Driver
                      </CTA>
                    </div>
                  </div>
                )}

                <div className="p-3 space-y-2 flex-1 overflow-auto h=[520px] h-[520px]">
                  {drivers.map((d) => (
                    <DriverCard key={d.id} d={d} onStatus={updateDriverStatus} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <RightRail vehicles={vehicles} />
        </main>
      </div>
    </div>
  );
}
