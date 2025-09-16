"use client";

type Props = {
  label: string;
  value: number | string;
  caption?: string;
};

export default function KpiTile({ label, value, caption }: Props) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 hover:shadow transition-shadow">
      <div className="text-xs font-medium text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
        {value}
      </div>
      {caption ? (
        <div className="mt-1 text-xs text-neutral-500">{caption}</div>
      ) : null}
    </div>
  );
}
