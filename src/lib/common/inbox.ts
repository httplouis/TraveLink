// Simple localStorage "inbox" used by both User and Admin.
// Switch this to Supabase later without changing call sites.

export type InboxItem = {
  id: string;             // e.g., "RQ-2025-0001"
  createdAt: string;      // ISO
  unread: boolean;        // drives badges
  // Minimal fields Admin table needs; add more as you like:
  dept: string;
  purpose: string;
  requester?: string | null;
  vehicle?: string | null;
  date: string;           // yyyy-mm-dd (request date)
  status: "Pending";      // new submissions are pending
};

const KEY = "travilink_requests_inbox";

function read(): InboxItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as InboxItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: InboxItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  // let other tabs (Admin/User) react
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function inboxCount(): number {
  return read().filter((i) => i.unread).length;
}

export function addToInbox(item: Omit<InboxItem, "id" | "createdAt" | "unread" | "status"> & { id?: string }) {
  const items = read();
  const id = item.id ?? `RQ-${Date.now()}`;
  items.unshift({ ...item, id, createdAt: new Date().toISOString(), unread: true, status: "Pending" });
  write(items);
  return id;
}

export function peekAll(): InboxItem[] {
  return read();
}

export function takeAll(): InboxItem[] {
  const items = read();
  write(items); // no-op, keeps unread
  return items;
}

export function markRead(ids: string[]) {
  if (!ids.length) return;
  const items = read().map(i => (ids.includes(i.id) ? { ...i, unread: false } : i));
  write(items);
}

export function clearInbox() {
  write([]);
}
