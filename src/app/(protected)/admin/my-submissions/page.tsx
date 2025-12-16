// src/app/(protected)/admin/my-submissions/page.tsx
"use client";

import { Suspense } from "react";
import SubmissionsView from "@/components/user/submissions/SubmissionsViewClean";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminMySubmissionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] rounded-xl text-white">
              <FileText className="h-6 w-6" />
            </div>
            My Submissions
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track your personal travel requests and their status
          </p>
        </div>
        <Link
          href="/admin/my-request"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg transition-all font-medium"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Link>
      </div>

      {/* Submissions List */}
      <Suspense fallback={
        <div className="p-8 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7a0019] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      }>
        <SubmissionsView />
      </Suspense>
    </div>
  );
}
