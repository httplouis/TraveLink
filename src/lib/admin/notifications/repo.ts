// src/lib/admin/notifications/repo.ts
import type { Notification, NotifKind } from "./types";

const KEY = "tl.notifications.v2";

export function loadAll(): Notification[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (raw) { try { return JSON.parse(raw) as Notification[]; } catch {} }
  const seeded = seed();
  localStorage.setItem(KEY, JSON.stringify(seeded));
  return seeded;
}
export function saveAll(items: Notification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}
export function list(limit = 30): Notification[] {
  return loadAll().sort((a,b)=>+new Date(b.createdAt)-+new Date(a.createdAt)).slice(0, limit);
}
export function listUnread(): Notification[] { return list(200).filter(n => !n.read); }
export function markAsRead(id: string) { saveAll(loadAll().map(n => n.id===id?{...n,read:true}:n)); }
export function markAllAsRead() { saveAll(loadAll().map(n => ({...n,read:true}))); }

export function pushMock(input: {
  kind?: NotifKind; title?: string; body?: string; href?: string;
}) {
  const now = new Date().toISOString();
  const n: Notification = {
    id: crypto.randomUUID(),
    kind: input.kind ?? "update",
    title: input.title ?? "New Travel Request submitted — REQ-2025-014",
    body:  input.body  ?? "Department: CCMS · Travel date: Oct 25, 9:00 AM",
    createdAt: now,
    read: false,
    actorName: "Travelink System",
    actorAvatarUrl: null,
    href: input.href ?? "/admin/inbox?view=REQ-2025-014",
  };
  const items = [n, ...loadAll()];
  saveAll(items);
  return n;
}

function seed(): Notification[] {
  const now = Date.now();
  const mk = (minsAgo: number, p: Partial<Notification>): Notification => ({
    id: crypto.randomUUID(),
    kind: "update",
    title: "System update",
    createdAt: new Date(now - minsAgo * 60 * 1000).toISOString(),
    read: false,
    actorName: "Travelink System",
    actorAvatarUrl: null,
    ...p,
  });

  return [
    mk(8,   { kind: "update",  title: "Trip started — TRIP-2025-108", body: "Driver: R. Cruz · Vehicle: VAN-12", href: "/admin/schedule/TRIP-2025-108" }),
    mk(20,  { kind: "update",  title: "Maintenance ticket created — MT-00231", body: "Vehicle: VAN-12 · Category: Preventive", href: "/admin/maintenance/MT-00231" }),
    mk(45,  { kind: "update",  title: "New Travel Request submitted — REQ-2025-014", body: "Department: CCMS · Travel date: Oct 25, 9:00 AM", href: "/admin/inbox?view=REQ-2025-014" }),
    mk(90,  { kind: "update",  title: "Request moved to 'For Approval' — REQ-2025-009", body: "Requester: CBA · Vehicle: VAN-12", href: "/admin/inbox?view=REQ-2025-009" }),
    mk(180, { kind: "update",  title: "Driver assigned — REQ-2025-008", body: "Driver: D. Santos · Vehicle: VAN-03", href: "/admin/inbox?view=REQ-2025-008" }),
    mk(300, { kind: "update",  title: "Schedule updated — TRIP-2025-102", body: "Pickup time changed to 2:30 PM", href: "/admin/schedule/TRIP-2025-102" }),
    mk(1440,{ kind: "comment", title: "New note on REQ-2025-007", body: "Transport Office: Please attach the signed memo.", href: "/admin/inbox?view=REQ-2025-007" }),
    mk(2880,{ kind: "update",  title: "Vehicle status changed — VAN-03", body: "Status: Under Repair · ETA back: Oct 25, 10:00", href: "/admin/vehicles/VAN-03" }),
  ];
}
