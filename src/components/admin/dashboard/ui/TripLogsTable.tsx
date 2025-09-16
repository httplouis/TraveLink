import type { TripLogRow } from "@/lib/admin/types";

export default function TripLogsTable({ rows }: { rows: TripLogRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-sm text-neutral-700">
        <thead className="bg-neutral-100/70 text-neutral-600 uppercase text-xs tracking-wide">
          <tr>
            <Th className="w-[110px]">Trip ID</Th>
            <Th>Vehicle</Th>
            <Th>Driver</Th>
            <Th>Department</Th>
            <Th className="w-[140px]">Date</Th>
            <Th className="w-[120px] text-right">Distance (km)</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {rows.map((r) => (
            <tr
              key={r.id}
              className="hover:bg-neutral-50 transition-colors"
            >
              <Td className="font-medium text-neutral-900">{r.id}</Td>
              <Td>{r.vehicle}</Td>
              <Td>{r.driver}</Td>
              <Td>{r.department}</Td>
              <Td className="tabular-nums text-neutral-600">{r.date}</Td>
              <Td className="tabular-nums text-right font-semibold text-neutral-800">
                {r.distanceKm.toFixed(1)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={`px-4 py-3 whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}
