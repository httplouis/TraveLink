// src/lib/admin/requests/trashRepo.ts
// Only needed because PageInner uses it (Trash feature). If you already have this file, keep yours.
import type { AdminRequest } from "@/lib/admin/requests/store";
export type TrashItem = AdminRequest & { deletedAt: string };

let TRASH: TrashItem[] = [];

export function addMany(items: TrashItem[]) { TRASH = [...items, ...TRASH]; }
export function list(): TrashItem[] { return [...TRASH]; }
export function removeMany(ids: string[]) {
  const s = new Set(ids);
  TRASH = TRASH.filter((t) => !s.has(t.id));
}
export function clear() { TRASH = []; }
export function purgeOlderThan(days: number) {
  const now = Date.now(), ms = days * 24 * 60 * 60 * 1000;
  TRASH = TRASH.filter((t) => now - new Date(t.deletedAt).getTime() < ms);
}
export function take(ids: string[]): AdminRequest[] {
  const s = new Set(ids);
  const keep: TrashItem[] = [];
  const picked: AdminRequest[] = [];
  for (const t of TRASH) {
    if (s.has(t.id)) {
      const { deletedAt, ...rest } = t;
      picked.push(rest);
    } else keep.push(t);
  }
  TRASH = keep;
  return picked;
}
