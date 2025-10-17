"use client";

/**
 * Tracks:
 * - last time the Admin Requests page was opened
 * - a set of ids that were explicitly marked as read (opened in details or “mark read”)
 */

const KEY_LAST_VISITED = "admin.requests.lastVisited.v1";
const KEY_READ_IDS = "admin.requests.readIds.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function markVisitedNow() {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_LAST_VISITED, Date.now().toString());
}

export function getReadIds(): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    const raw = localStorage.getItem(KEY_READ_IDS);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(set: Set<string>) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY_READ_IDS, JSON.stringify([...set]));
}

export function markRead(id: string) {
  const set = getReadIds();
  set.add(id);
  saveReadIds(set);
}

export function markManyRead(ids: string[]) {
  const set = getReadIds();
  ids.forEach((x) => set.add(x));
  saveReadIds(set);
}

/** For the nav badge */
export function computeNavBadgeCount(
  items: { id: string; createdAt: string }[]
): number {
  if (!isBrowser()) return 0;
  const last = Number(localStorage.getItem(KEY_LAST_VISITED) || "0");
  const read = getReadIds();
  return items.filter((it) => {
    const newer = Date.parse(it.createdAt) > last;
    const unread = !read.has(it.id);
    return newer || unread;
  }).length;
}
