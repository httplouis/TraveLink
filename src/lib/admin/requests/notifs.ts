// src/lib/admin/requests/notifs.ts
export type Id = string;

const READ_KEY = "tl.requests.read.v1";
const VISIT_KEY = "tl.requests.lastvisit.v1";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

/* read ids */
export function getReadIds(): Set<Id> {
  if (!canUseStorage()) return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as Id[]);
  } catch {
    return new Set();
  }
}
function saveReadIds(set: Set<Id>) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}
export function markRead(id: Id) {
  const s = getReadIds();
  if (!s.has(id)) {
    s.add(id);
    saveReadIds(s);
  }
}
export function markManyRead(ids: Id[]) {
  const s = getReadIds();
  let changed = false;
  ids.forEach((id) => {
    if (!s.has(id)) {
      s.add(id);
      changed = true;
    }
  });
  if (changed) saveReadIds(s);
}
export function isRead(id: Id) {
  return getReadIds().has(id);
}

/* last visited (for nav badge) */
export function getLastVisited(): number {
  if (!canUseStorage()) return 0;
  const raw = localStorage.getItem(VISIT_KEY);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
export function markVisitedNow() {
  if (!canUseStorage()) return;
  localStorage.setItem(VISIT_KEY, String(Date.now()));
}

/* helpers */
export type LiteRequest = { id: string; createdAt?: string | number | Date };
function ts(x?: string | number | Date) {
  if (!x) return 0;
  const d = new Date(x);
  return d.getTime() || 0;
}
export function computeUnreadIds(list: LiteRequest[]): Set<Id> {
  const read = getReadIds();
  const out = new Set<Id>();
  list.forEach((r) => {
    if (!read.has(r.id)) out.add(r.id);
  });
  return out;
}
export function computeNavBadgeCount(list: LiteRequest[]): number {
  const last = getLastVisited();
  return list.reduce((acc, r) => (ts(r.createdAt) > last ? acc + 1 : acc), 0);
}
