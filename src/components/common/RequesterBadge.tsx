"use client";

import { User, UserCircle, Users } from "lucide-react";

interface RequesterBadgeProps {
  requestingPerson: string;
  submittedBy: string;
  isRepresentative: boolean;
  variant?: "compact" | "full";
}

/**
 * Shows requester with icon badge
 * - Direct: Person submitted for themselves
 * - Representative: Someone submitted on behalf of another
 */
export default function RequesterBadge({
  requestingPerson,
  submittedBy,
  isRepresentative,
  variant = "compact",
}: RequesterBadgeProps) {
  
  if (!isRepresentative) {
    // Direct submission - simple display
    if (variant === "compact") {
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#7A0010]" />
          <span className="font-medium text-neutral-900">{requestingPerson}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <User className="h-5 w-5 text-[#7A0010]" />
        <div>
          <p className="text-sm font-medium text-slate-900">{requestingPerson}</p>
          <p className="text-xs text-slate-600">Self-submitted</p>
        </div>
      </div>
    );
  }

  // Representative submission
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-[#7A0010]" />
          <span className="font-medium text-neutral-900">{requestingPerson}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-neutral-600">
          <span>via</span>
          <UserCircle className="h-3 w-3" />
          <span>{submittedBy}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Users className="h-5 w-5 text-[#7A0010] mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900">{requestingPerson}</span>
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-[#7A0010]">
              REPRESENTED
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#7A0010]">
            <UserCircle className="h-4 w-4" />
            <span>Submitted by <strong>{submittedBy}</strong></span>
          </div>
          <p className="text-xs text-[#7A0010]/80 mt-1">
            {submittedBy} created this request on behalf of {requestingPerson}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact inline version for lists
 */
export function RequesterInline({
  requestingPerson,
  submittedBy,
  isRepresentative,
}: Omit<RequesterBadgeProps, "variant">) {
  if (!isRepresentative) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <User className="h-3.5 w-3.5 text-[#7A0010]" />
        <span className="font-medium">{requestingPerson}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Users className="h-3.5 w-3.5 text-[#7A0010]" />
      <span className="font-medium">{requestingPerson}</span>
      <span className="text-neutral-400">•</span>
      <div className="flex items-center gap-1 text-neutral-600">
        <span className="text-xs">via</span>
        <UserCircle className="h-3 w-3" />
        <span className="text-xs">{submittedBy}</span>
      </div>
    </div>
  );
}

/**
 * Utility to determine if submission is representative
 */
export function isRepresentativeSubmission(
  accountUserId: string,
  requesterId: string
): boolean {
  return accountUserId !== requesterId;
}
