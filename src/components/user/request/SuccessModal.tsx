// src/components/user/request/SuccessModal.tsx
"use client";

import { useRouter } from "next/navigation";

interface SuccessModalProps {
  data: any;
  onClose: () => void;
}

export default function SuccessModal({ data, onClose }: SuccessModalProps) {
  const router = useRouter();

  const requestNumber = data?.request_number || "—";
  const status = data?.status || "pending_head";
  const department = data?.department?.name || data?.department?.code || "your department";
  
  // Determine who receives it next
  const nextApprover = getNextApproverText(status);

  function handleViewMyRequests() {
    onClose();
    router.push("/user/submissions");
  }

  function handleNewRequest() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Success Animation Header */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Request Submitted Successfully!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your travel request has been sent for approval
          </p>
        </div>

        {/* Request Details */}
        <div className="px-8 py-6">
          <div className="space-y-4">
            {/* Request Number */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">Request Number</span>
              <span className="rounded-md bg-[#7A0010] px-3 py-1 text-sm font-bold text-white">
                {requestNumber}
              </span>
            </div>

            {/* Routing Info */}
            <div className="rounded-lg border-2 border-blue-100 bg-blue-50/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">Next Step</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    {nextApprover}
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    You will be notified once your department head reviews your request.
                  </p>
                </div>
              </div>
            </div>

            {/* Approval Path Preview */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-700">Approval Path</h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                    ✓
                  </div>
                  <span className="font-medium text-gray-600">You</span>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-white">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
                  </div>
                  <span className="font-medium text-amber-700">Dept. Head</span>
                </div>
                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white">
                    •
                  </div>
                  <span className="text-gray-400">Admin</span>
                </div>
                <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-white">
                    •
                  </div>
                  <span className="text-gray-400">...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleViewMyRequests}
              className="flex-1 rounded-lg bg-[#7A0010] px-4 py-3 font-semibold text-white shadow-md transition-all hover:bg-[#5A0010] hover:shadow-lg active:scale-[0.98]"
            >
              View My Requests
            </button>
            <button
              onClick={handleNewRequest}
              className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-[0.98]"
            >
              New Request
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getNextApproverText(status: string): string {
  switch (status) {
    case "pending_head":
      return "Your request has been sent to your Department Head for review and endorsement.";
    case "pending_admin":
      return "Your request has been sent to the Transport Office for processing.";
    case "pending_comptroller":
      return "Your request is being reviewed by the Comptroller's Office.";
    case "pending_hr":
      return "Your request is being reviewed by the HR Department.";
    case "pending_exec":
      return "Your request is awaiting executive approval.";
    default:
      return "Your request is being processed.";
  }
}
