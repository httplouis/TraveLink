// src/app/(protected)/comptroller/inbox/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { AdminRequestsRepo, type AdminRequest } from "@/lib/admin/requests/store";

function Row({ r }: { r: AdminRequest }) {
  const to = `/comptroller/review/${encodeURIComponent(r.id)}`;
  const t = r.travelOrder;
  const dept = t?.department ?? "—";
  const who = t?.requestingPerson ?? "—";
  const purpose = t?.purposeOfTravel ?? "—";
  const date = new Date(r.createdAt).toLocaleString();

  return (
    <tr className="border-b hover:bg-neutral-50">
      <td className="px-3 py-2 text-sm">{date}</td>
      <td className="px-3 py-2 text-sm">{dept}</td>
      <td className="px-3 py-2 text-sm">{who}</td>
      <td className="px-3 py-2 text-sm">{purpose}</td>
      <td className="px-3 py-2 text-sm">
        <Link
          href={to}
          className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-100"
        >
          Review
        </Link>
      </td>
    </tr>
  );
}

export default function Page() {
  const [rows, setRows] = React.useState<AdminRequest[]>([]);

  React.useEffect(() => {
    const load = () => {
      const list = AdminRequestsRepo
        .list()
        .filter((x) => x.status === "comptroller_pending");
      setRows(list);
    };
    load();
    const id = setInterval(load, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Comptroller — Inbox</h1>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-[720px] w-full">
          <thead className="bg-neutral-50 text-xs text-neutral-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Submitted</th>
              <th className="px-3 py-2 text-left font-medium">Department</th>
              <th className="px-3 py-2 text-left font-medium">Requester</th>
              <th className="px-3 py-2 text-left font-medium">Purpose</th>
              <th className="px-3 py-2 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => <Row key={r.id} r={r} />)
            ) : (
              <tr>
                <td className="px-3 py-6 text-sm text-neutral-500" colSpan={5}>
                  No items.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
