"use client";

import type { AdminRequest } from "@/lib/admin/requests/store";

export type TrashItem = AdminRequest & { deletedAt: string };

const TRASH_KEY = "admin.requests.trash.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeRead(): TrashItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TRASH_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as TrashItem[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(list: TrashItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(TRASH_KEY, JSON.stringify(list));
}

/** Newest first */
export function list(): TrashItem[] {
  const items = safeRead();
  return [...items].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
export const listAll = list;

export function add(req: AdminRequest, deletedAtISO?: string) {
  const now = deletedAtISO ?? new Date().toISOString();
  const items = safeRead();
  const i = items.findIndex((t) => t.id === req.id);
  const next: TrashItem = { ...req, deletedAt: now };
  if (i >= 0) items[i] = next; else items.unshift(next);
  safeWrite(items);
}

export function addMany(reqs: AdminRequest[], deletedAtISO?: string) {
  const now = deletedAtISO ?? new Date().toISOString();
  const cur = safeRead();
  const map = new Map(cur.map((t) => [t.id, t] as const));
  for (const r of reqs) map.set(r.id, { ...r, deletedAt: now });
  safeWrite([...map.values()]);
}

export function take(ids: string[]): AdminRequest[] {
  const set = new Set(ids);
  const cur = safeRead();
  const kept: TrashItem[] = [];
  const removed: AdminRequest[] = [];
  for (const t of cur) {
    if (set.has(t.id)) {
      const { deletedAt: _drop, ...rest } = t;
      removed.push(rest);
    } else kept.push(t);
  }
  safeWrite(kept);
  return removed;
}

export function removeMany(ids: string[]) {
  const set = new Set(ids);
  const kept = safeRead().filter((t) => !set.has(t.id));
  safeWrite(kept);
}

export function purgeOlderThan(days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const kept = safeRead().filter((t) => Date.parse(t.deletedAt) >= cutoff);
  safeWrite(kept);
}
