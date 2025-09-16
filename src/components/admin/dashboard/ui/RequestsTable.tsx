"use client";

const data = [
  { id: "REQ-1001", dept: "CCMS", purpose: "Seminar", date: "2025-09-10", status: "Pending" },
  { id: "REQ-1002", dept: "HR", purpose: "Orientation", date: "2025-09-12", status: "Approved" },
];



export default function RequestsTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="w-full text-sm text-neutral-700">
        <thead className="bg-neutral-100/70 text-neutral-600 uppercase text-xs tracking-wide">
          <tr>
            <Th>ID</Th>
            <Th>Department</Th>
            <Th>Purpose</Th>
            <Th>Date</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
              <Td className="font-medium text-neutral-900">{row.id}</Td>
              <Td>{row.dept}</Td>
              <Td>{row.purpose}</Td>
              <Td className="tabular-nums text-neutral-600">{row.date}</Td>
              <Td>
                <StatusBadge status={row.status} />
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
    <th className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "Pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-neutral-100 text-neutral-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
