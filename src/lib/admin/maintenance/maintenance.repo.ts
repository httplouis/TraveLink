// src/lib/admin/maintenance/maintenance.repo.ts
"use client";

import { Maintenance, NextDueTint, tintFrom } from "./types";

const STORAGE_KEY = "tl:maintenance";

function loadAll(): Maintenance[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Maintenance[]) : [];
  } catch {
    return [];
  }
}

function saveAll(rows: Maintenance[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function uid(): string {
  // short, stable uid for mock/local usage
  return "m_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Recalculate derived fields. Keep logic tiny and deterministic. */
export function computeNextDue(m: Maintenance): Maintenance {
  const tint: NextDueTint = tintFrom(m.nextDueDateISO);
  return { ...m, nextDueTint: tint };
}

/** Read with simple in-memory filtering (used by container). */
export function query(): Maintenance[] {
  return loadAll();
}

/** Create or replace a row. */
export function upsert(
  data: Omit<Maintenance, "id" | "createdAt" | "updatedAt" | "history"> & {
    id?: string;
    history?: Maintenance["history"];
  }
): Maintenance {
  const rows = loadAll();
  const nowISO = new Date().toISOString();

  if (data.id) {
    const idx = rows.findIndex((r) => r.id === data.id);
    const history = data.history ?? rows[idx]?.history ?? [];
    const updated: Maintenance = computeNextDue({
      ...(rows[idx] ?? ({} as Maintenance)),
      ...data,
      id: data.id,
      createdAt: rows[idx]?.createdAt ?? nowISO,
      updatedAt: nowISO,
      history,
    });
    if (idx >= 0) rows[idx] = updated;
    else rows.push(updated);
    saveAll(rows);
    return updated;
  }

  const created: Maintenance = computeNextDue({
    ...(data as any),
    id: uid(),
    createdAt: nowISO,
    updatedAt: nowISO,
    history: data.history ?? [],
  });
  rows.push(created);
  saveAll(rows);
  return created;
}

/** Patch selected fields on a row. */
export function patch(
  id: string,
  data: Partial<Omit<Maintenance, "id" | "createdAt" | "history">>
): Maintenance | undefined {
  const rows = loadAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return undefined;

  const nowISO = new Date().toISOString();
  const merged = computeNextDue({
    ...rows[idx],
    ...data,
    id,
    updatedAt: nowISO,
  } as Maintenance);

  rows[idx] = merged;
  saveAll(rows);
  return merged;
}

// Provide a friendly alias some files may import
export const update = patch;

export function remove(id: string) {
  const rows = loadAll().filter((r) => r.id !== id);
  saveAll(rows);
}

export function removeMany(ids: string[]) {
  const set = new Set(ids);
  const rows = loadAll().filter((r) => !set.has(r.id));
  saveAll(rows);
}

export function exportCSV(rows: Maintenance[]): string {
  const header = [
    "id",
    "vehicle",
    "type",
    "status",
    "vendor",
    "costPhp",
    "date",
    "nextDueDateISO",
    "nextDueTint",
  ];
  const body = rows.map((r) =>
    [
      r.id,
      r.vehicle,
      r.type,
      r.status,
      r.vendor,
      r.costPhp,
      r.date,
      r.nextDueDateISO ?? "",
      r.nextDueTint,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...body].join("\n");
}
