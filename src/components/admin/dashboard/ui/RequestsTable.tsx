"use client";

import { motion } from "framer-motion";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

interface RequestRow {
  id: string;
  dept?: string;
  purpose?: string;
  date?: string;
  status?: string;
  requester?: string;
  request_number?: string;
}

interface Props {
  rows?: RequestRow[];
}

export default function RequestsTable({ rows = [] }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm">No recent requests</p>
      </div>
    );
  }

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
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {rows.map((row, index) => (
            <motion.tr 
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-neutral-50 transition-colors"
            >
              <Td className="font-medium text-neutral-900">
                {row.request_number || row.id?.slice(0, 8) || "N/A"}
              </Td>
              <Td>{row.dept || "Unknown"}</Td>
              <Td className="max-w-[200px] truncate">{row.purpose || "No purpose"}</Td>
              <Td className="tabular-nums text-neutral-600">{row.date || "N/A"}</Td>
              <Td>
                <StatusBadge status={row.status || "Unknown"} />
              </Td>
              <Td>
                <Link 
                  href={`/admin/requests?id=${row.id}`}
                  className="inline-flex items-center gap-1 text-[#7a0019] hover:underline text-xs font-medium"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              </Td>
            </motion.tr>
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
  const normalizedStatus = status.toLowerCase();
  
  let color = "bg-neutral-100 text-neutral-600";
  
  if (normalizedStatus.includes("approved") || normalizedStatus === "approved") {
    color = "bg-green-100 text-green-700";
  } else if (normalizedStatus.includes("pending") || normalizedStatus === "pending") {
    color = "bg-yellow-100 text-yellow-700";
  } else if (normalizedStatus.includes("rejected") || normalizedStatus === "rejected") {
    color = "bg-red-100 text-red-700";
  } else if (normalizedStatus.includes("completed") || normalizedStatus === "completed") {
    color = "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
