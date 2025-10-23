"use client";
export default function Toolbar({
  title = "Maintenance",
  subtitle = "Admin • Maintenance",
  right,
}: { title?: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">{subtitle}</div>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}
