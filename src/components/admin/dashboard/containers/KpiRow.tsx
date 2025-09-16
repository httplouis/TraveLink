"use client";

import KpiTile from "@/components/admin/dashboard/ui/KpiTile";

export type KPI = {
  label: string;
  value: number | string;
  caption?: string;
};

export default function KpiRow({ items }: { items: KPI[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((k) => (
        <KpiTile
          key={k.label}
          label={k.label}
          value={k.value}
          caption={k.caption}
        />
      ))}
    </div>
  );
}
