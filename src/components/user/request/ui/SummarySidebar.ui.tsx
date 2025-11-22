// components/user/request/ui/SummarySidebar.ui.tsx
"use client";

import * as React from "react";
import type { RequestFormData } from "@/lib/user/request/types";
import { ArrowRight, CheckCircle2, MapPin, Calendar, User, Building2, Users, FileText, Wallet, Briefcase, Crown, Truck, Settings } from "lucide-react";
import { getApproverDisplayName } from "@/lib/user/request/routing";

export default function SummarySidebar({
  data,
  firstHop,
  path,
}: {
  data: RequestFormData;
  firstHop: string;
  path: string[];
}) {
  const usedInstitutional = data.vehicleMode === "institutional";

  return (
    <aside className="sticky top-6 h-fit rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white via-gray-50/30 to-white p-6 shadow-xl">
      {/* Routing Preview - Enhanced */}
      <section className="mb-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-1.5">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h4 className="text-base font-bold text-gray-900">Routing Preview</h4>
          </div>
          <Badge tone={usedInstitutional ? "info" : "success"}>
            {usedInstitutional ? "With TM" : "Budget first"}
          </Badge>
        </div>

        <div className="mb-3 rounded-lg border border-blue-200 bg-white p-3">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            First receiver
          </div>
          <div className="text-sm font-bold text-gray-900">{getApproverDisplayName(firstHop)}</div>
        </div>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Full path</div>
        <Stepper steps={path} />
      </section>

      {/* Current Choices - Enhanced */}
      <section className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
          <div className="rounded-lg bg-maroon-600 p-1.5">
            <Users className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-base font-bold text-gray-900">Current Choices</h4>
        </div>
        <dl className="space-y-2.5">
          <EnhancedRow 
            icon={<User className="h-3.5 w-3.5" />}
            name="Requester" 
            value={titleCase(data.requesterRole)} 
          />
          <EnhancedRow 
            icon={<FileText className="h-3.5 w-3.5" />}
            name="Reason" 
            value={reasonLabel(data.reason)} 
          />
          <EnhancedRow 
            icon={<Building2 className="h-3.5 w-3.5" />}
            name="Vehicle" 
            value={vehicleLabel(data.vehicleMode)} 
          />
        </dl>
        {data.reason === "seminar" && (
          <div className="mt-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-2.5">
            <Badge tone="warn" className="text-xs">Seminar application required</Badge>
          </div>
        )}
      </section>

      {/* Travel Snapshot - Enhanced */}
      <section className="mb-6 rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
          <div className="rounded-lg bg-emerald-600 p-1.5">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-base font-bold text-gray-900">Travel Snapshot</h4>
        </div>
        <dl className="space-y-2.5">
          <EnhancedRow 
            icon={<MapPin className="h-3.5 w-3.5" />}
            name="Destination" 
            value={data.travelOrder?.destination || "—"} 
          />
          <EnhancedRow 
            icon={<Calendar className="h-3.5 w-3.5" />}
            name="Dates" 
            value={dateRange(data.travelOrder?.departureDate, data.travelOrder?.returnDate)} 
          />
          <EnhancedRow 
            icon={<User className="h-3.5 w-3.5" />}
            name="Requester" 
            value={data.travelOrder?.requestingPerson || "—"} 
          />
          <EnhancedRow 
            icon={<Building2 className="h-3.5 w-3.5" />}
            name="Department" 
            value={data.travelOrder?.department || "—"} 
          />
        </dl>
      </section>

      {/* Fixed Approvers - Enhanced */}
      <section className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
          <div className="rounded-lg bg-purple-600 p-1.5">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-base font-bold text-gray-900">Approvers (fixed)</h4>
        </div>
        <ul className="space-y-2">
          {[
            // Show Department Head first if requester is faculty
            ...(data.requesterRole === "faculty" ? [
              { name: "Department Head", icon: <User className="h-4 w-4 text-blue-600" /> }
            ] : []),
            // Transportation Manager (Admin) - always shown
            { name: "Transportation Manager (Admin)", icon: <Settings className="h-4 w-4 text-purple-600" /> },
            { name: "Comptroller", icon: <Wallet className="h-4 w-4 text-purple-600" /> },
            { name: "Human Resources Department", icon: <Users className="h-4 w-4 text-blue-600" /> },
            { name: "Vice President", icon: <Briefcase className="h-4 w-4 text-indigo-600" /> },
            { name: "President / COO", icon: <Crown className="h-4 w-4 text-amber-600" />, conditional: data.requesterRole === "head", note: "(for Heads only)" },
            { name: "Transportation Manager", icon: <Truck className="h-4 w-4 text-amber-600" /> },
          ].map((approver, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2.5 transition-all ${
                approver.conditional === false ? "opacity-50" : "hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {approver.icon && (
                <div className="flex-shrink-0">{approver.icon}</div>
              )}
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900">{approver.name}</span>
                {approver.note && (
                  <span className="ml-2 text-xs text-gray-500">{approver.note}</span>
                )}
              </div>
              {approver.conditional !== false && (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
              )}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

/* ---------- Enhanced UI Components ---------- */

function EnhancedRow({ 
  icon, 
  name, 
  value 
}: { 
  icon: React.ReactNode; 
  name: string; 
  value: React.ReactNode 
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 transition-all hover:border-gray-300 hover:bg-gray-50">
      <div className="mt-0.5 text-gray-600">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">{name}</div>
        <div className="text-sm font-semibold text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

function Stepper({ steps }: { steps: string[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div
          key={`${s}-${i}`}
          className="flex items-center gap-3 rounded-lg border-2 bg-white p-2.5 transition-all"
          style={{
            borderColor: i === 0 ? '#7A0010' : '#E5E7EB',
            backgroundColor: i === 0 ? '#FEF2F2' : 'white',
          }}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all ${
              i === 0
                ? "bg-gradient-to-br from-maroon-600 to-maroon-700 text-white shadow-maroon-200"
                : "bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700"
            }`}
          >
            {i + 1}
          </div>
          <div className="flex-1">
            <span className={`text-sm font-semibold ${
              i === 0 ? "text-maroon-900" : "text-gray-700"
            }`}>
              {getApproverDisplayName(s)}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
}

function Badge({
  children,
  tone = "neutral",
  className = "",
}: React.PropsWithChildren<{ tone?: "neutral" | "info" | "success" | "warn" | "danger"; className?: string }>) {
  const tones: Record<string, string> = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-600 shadow-sm",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-sm",
    warn: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-sm",
    danger: "bg-gradient-to-r from-rose-500 to-rose-600 text-white border-rose-600 shadow-sm",
  };
  return (
    <span className={`rounded-lg border-2 px-2.5 py-1 text-xs font-bold shadow-sm ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------- Helper Functions ---------- */

function pretty(s: string) {
  // small prettifier for enum-ish codes like "OSAS_ADMIN" → "OSAS Admin"
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

function reasonLabel(r: RequestFormData["reason"]) {
  switch (r) {
    case "seminar":
      return "Seminar / Training";
    case "educational":
      return "Educational Trip";
    case "competition":
      return "Competition";
    case "visit":
    default:
      return "Visit";
  }
}

function vehicleLabel(v: RequestFormData["vehicleMode"]) {
  switch (v) {
    case "institutional":
      return "Institutional vehicle";
    case "owned":
      return "Owned vehicle";
    case "rent":
      return "Rent (external)";
    default:
      return titleCase(v as string);
  }
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return "—";
  if (from && !to) return new Date(from).toLocaleDateString();
  if (!from && to) return new Date(to).toLocaleDateString();
  try {
    const a = new Date(from as string).toLocaleDateString();
    const b = new Date(to as string).toLocaleDateString();
    return `${a} → ${b}`;
  } catch {
    return `${from || "—"} → ${to || "—"}`;
  }
}
