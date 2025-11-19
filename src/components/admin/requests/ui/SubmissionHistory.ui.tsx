// src/components/admin/requests/ui/SubmissionHistory.ui.tsx
"use client";

import React from "react";

type HistoryEntry = {
  action: string;
  by: string;
  timestamp: string;
  icon: "submitted" | "approved" | "rejected";
  signature?: string | null;
};

type Props = {
  entries: HistoryEntry[];
};

export default function SubmissionHistoryUI({ entries }: Props) {
  if (entries.length === 0) return null;

  console.log("📜 SubmissionHistory received entries:", entries.length);
  entries.forEach((entry, idx) => {
    console.log(`  ${idx + 1}. ${entry.action} - Signature: ${entry.signature ? "EXISTS" : "NULL"}`);
  });

  return (
    <div className="mt-6 bg-slate-50 rounded-lg border border-slate-200 p-6">
      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-6">
        <svg className="h-5 w-5 text-[#7A0010]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Submission History
      </h3>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;
          
          let iconBg = "bg-blue-100";
          let iconColor = "text-blue-600";
          let iconPath = "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";

          if (entry.icon === "approved") {
            iconBg = "bg-green-100";
            iconColor = "text-green-600";
            iconPath = "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
          } else if (entry.icon === "rejected") {
            iconBg = "bg-red-100";
            iconColor = "text-red-600";
            iconPath = "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z";
          }

          return (
            <div key={index} className="flex items-start gap-4">
              {/* Icon */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
                  <svg className={`h-5 w-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                  </svg>
                </div>
                {!isLast && (
                  <div className="absolute top-10 left-5 w-0.5 h-8 bg-slate-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="font-semibold text-slate-900">{entry.action}</div>
                <div className="text-sm text-slate-600">by {entry.by}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {new Date(entry.timestamp).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "Asia/Manila",
                  })}
                  {" • "}
                  {new Date(entry.timestamp).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "Asia/Manila",
                  })}
                </div>
                {entry.signature && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 mb-2">Digital Signature</div>
                    <img 
                      src={entry.signature} 
                      alt="Signature" 
                      className="h-16 border border-slate-300 rounded bg-white p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
