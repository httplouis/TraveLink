// src/app/(protected)/admin/requests/trash/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import * as TrashRepo from "@/lib/admin/requests/trashRepo";
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";

type TrashItem = TrashRepo.TrashItem;

export default function TrashPage() {
  const [items, setItems] = React.useState<TrashItem[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    TrashRepo.purgeOlderThan(30); // housekeeping
    setItems(TrashRepo.list());
  }, []);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map((i) => i.id)) : new Set());
  };

  const restoreSelected = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;

    // Try to reinsert into main repo (best-effort)
    const toRestore = TrashRepo.take(ids); // remove from TRASH + return copies
    const repoAny = AdminRequestsRepo as unknown as {
      addMany?: (arr: AdminRequest[]) => void;
      upsertMany?: (arr: AdminRequest[]) => void;
      add?: (req: AdminRequest) => void;
      upsert?: (req: AdminRequest) => void;
    };

    if (repoAny.addMany) repoAny.addMany(toRestore);
    else if (repoAny.upsertMany) repoAny.upsertMany(toRestore);
    else if (repoAny.add) toRestore.forEach((x) => repoAny.add!(x));
    else if (repoAny.upsert) toRestore.forEach((x) => repoAny.upsert!(x));

    setItems(TrashRepo.list());
    setSelected(new Set());
  };

  const deleteSelectedForever = () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    TrashRepo.removeMany(ids);
    setItems(TrashRepo.list());
    setSelected(new Set());
  };

  if (!mounted) return <div />;

  const allChecked = items.length > 0 && items.every((i) => selected.has(i.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Link>
          <h1 className="text-lg font-semibold">Trash (kept for 30 days)</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
            onClick={restoreSelected}
            disabled={!selected.size}
            title="Restore selected"
          >
            <RotateCcw className="h-4 w-4" />
            Restore selected {selected.size ? `(${selected.size})` : ""}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800 disabled:opacity-50"
            onClick={deleteSelectedForever}
            disabled={!selected.size}
            title="Delete permanently"
          >
            <Trash2 className="h-4 w-4" />
            Delete permanently
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300"
              checked={allChecked}
              onChange={(e) => toggleAll(e.target.checked)}
              suppressHydrationWarning
            />
            <span>Select all</span>
          </label>
          <div className="text-neutral-600">{items.length} item(s)</div>
        </div>

        <ul className="space-y-3">
          {items.map((t) => {
            const created = t.createdAt; // show raw ISO to avoid locale mismatches
            const deletedAt = t.deletedAt; // ISO from repo
            return (
              <li
                key={t.id}
                className="relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-neutral-300" />
                <div className="absolute right-4 top-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    suppressHydrationWarning
                  />
                </div>

                <div className="text-sm text-neutral-600">{t.travelOrder?.department || "—"}</div>
                <div className="mt-0.5 font-semibold leading-tight">
                  {t.travelOrder?.purposeOfTravel || "—"}
                </div>

                <div className="mt-2 text-sm text-neutral-700">
                  <span className="text-neutral-500">Requested by:</span>{" "}
                  {t.travelOrder?.requestingPerson || "—"}
                </div>

                <div className="mt-1 text-sm text-neutral-700">
                  <span className="text-neutral-500">Driver:</span> {t.driver || "—"}{" "}
                  <span className="mx-2">•</span>
                  <span className="text-neutral-500">Vehicle:</span> {t.vehicle || "—"}{" "}
                  <span className="mx-2">•</span>
                  <span className="text-neutral-500">Created:</span> {created}
                </div>

                <div className="mt-1 text-xs text-neutral-500">
                  Deleted: {deletedAt}
                </div>
              </li>
            );
          })}

          {!items.length && (
            <li className="rounded-xl border border-dashed p-10 text-center text-sm text-neutral-500">
              Trash is empty.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
