"use client";
import type { MaintRecord, MaintStatus } from "@/lib/admin/maintenance";
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileText } from "lucide-react";

const ORDER: MaintStatus[] = [
  "Submitted","Acknowledged","In-Progress","Completed","Rejected"
];

const COLORS: Record<MaintStatus, string> = {
  Submitted: "bg-slate-50",
  Acknowledged: "bg-blue-50",
  "In-Progress": "bg-amber-50",
  Completed: "bg-emerald-50",
  Rejected: "bg-rose-50",
};

const ICONS: Record<MaintStatus, React.ComponentType<any>> = {
  Submitted: FileText,
  Acknowledged: Clock,
  "In-Progress": Clock,
  Completed: CheckCircle2,
  Rejected: XCircle,
};

export default function MaintenanceKpiBar({ rows }: { rows: MaintRecord[] }) {
  const counts = ORDER.map((s) => rows.filter((r) => r.status === s).length);
  
  // Calculate overdue maintenance (scheduled_date in the past but not completed)
  const now = new Date();
  const overdue = rows.filter((r) => {
    if (!r.scheduled_date || r.status === "Completed" || r.status === "Rejected") return false;
    const scheduled = new Date(r.scheduled_date);
    return scheduled < now;
  }).length;
  
  // Calculate upcoming (scheduled in next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const upcoming = rows.filter((r) => {
    if (!r.scheduled_date || r.status === "Completed" || r.status === "Rejected") return false;
    const scheduled = new Date(r.scheduled_date);
    return scheduled >= now && scheduled <= thirtyDaysFromNow;
  }).length;
  
  // Total cost
  const totalCost = rows
    .filter((r) => r.status === "Completed")
    .reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-4">
      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {ORDER.map((s, i) => {
          const Icon = ICONS[s];
          return (
            <div
              key={s}
              className={`rounded-xl p-5 ${COLORS[s]} ring-1 ring-black/5 shadow-md hover:shadow-lg transition-shadow border-l-4 ${
                s === "Submitted" ? "border-slate-400" :
                s === "Acknowledged" ? "border-blue-400" :
                s === "In-Progress" ? "border-amber-400" :
                s === "Completed" ? "border-emerald-400" :
                "border-rose-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-neutral-600" />
                <div className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{s}</div>
              </div>
              <div className="text-3xl font-bold text-neutral-900">{counts[i]}</div>
            </div>
          );
        })}
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 bg-red-50 ring-1 ring-black/5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div className="text-xs font-medium text-red-700 uppercase tracking-wide">Overdue</div>
          </div>
          <div className="text-3xl font-bold text-red-900">{overdue}</div>
          <div className="text-xs text-red-600 mt-1">Past scheduled date</div>
        </div>
        
        <div className="rounded-xl p-5 bg-blue-50 ring-1 ring-black/5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-400">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Upcoming</div>
          </div>
          <div className="text-3xl font-bold text-blue-900">{upcoming}</div>
          <div className="text-xs text-blue-600 mt-1">Next 30 days</div>
        </div>
        
        <div className="rounded-xl p-5 bg-green-50 ring-1 ring-black/5 shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-400">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Cost</div>
          </div>
          <div className="text-2xl font-bold text-green-900">
            ₱{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-green-600 mt-1">Completed maintenance</div>
        </div>
      </div>
    </div>
  );
}
