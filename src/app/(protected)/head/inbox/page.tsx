"use client";

import * as React from "react";
import Link from "next/link";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";

export default function HeadInboxPage() {
  // TODO: replace with real auth (current head user)
  const currentHead = { id: "HEAD-USER-ID", name: "Department Head" };

  const [items, setItems] = React.useState(() =>
    AdminRequestsRepo
      .list()
      .filter(r => r.status === "pending_head")
  );

  React.useEffect(() => {
    const refresh = () => {
      setItems(
        AdminRequestsRepo
          .list()
          .filter(r => r.status === "pending_head")
      );
    };
    refresh();
    const unsub = AdminRequestsRepo.subscribe(refresh);
    return () => { unsub(); };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inbox — Pending Endorsements</h1>
        <div className="text-sm text-neutral-600">{items.length} item(s)</div>
      </div>

      <div className="grid gap-3">
        {items.map((r) => {
          const t = r.travelOrder as any;
          const purpose = t?.purposeOfTravel || t?.purpose || "Travel Order";
          const dept = t?.department || "—";
          const dest = t?.destination || "—";
          const when = new Date(r.createdAt).toLocaleString();

          return (
            <Link
              key={r.id}
              href={`/head/review/${r.id}`}
              className="rounded-lg border border-neutral-200 bg-white p-4 hover:bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-neutral-900">{purpose}</div>
                <div className="text-xs text-neutral-500">{when}</div>
              </div>
              <div className="mt-1 text-sm text-neutral-700">{dept} • {dest}</div>
              <div className="mt-0.5 text-xs text-neutral-500">
                Filed by {t?.requestingPerson || "—"}
              </div>
            </Link>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-neutral-500">
            No pending items for endorsement.
          </div>
        )}
      </div>
    </div>
  );
}
