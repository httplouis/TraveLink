/**
 * Request utility functions for calculating pending duration, urgency, etc.
 */

export interface RequestForCalculation {
  id: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  is_international?: boolean;
  is_urgent?: boolean;
  is_priority?: boolean;
  returned_at?: string | null;
}

/**
 * Calculate days since last status change (or creation if never changed)
 */
export function calculatePendingDays(request: RequestForCalculation): number {
  const lastChangeDate = request.updated_at || request.created_at;
  if (!lastChangeDate) return 0;

  const lastChange = new Date(lastChangeDate);
  const now = new Date();
  const diffTime = now.getTime() - lastChange.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if request has been pending for more than 1 day
 */
export function isPendingLongTime(request: RequestForCalculation): boolean {
  if (!request.status.startsWith("pending_")) return false;
  return calculatePendingDays(request) > 1;
}

/**
 * Calculate days until travel date
 */
export function calculateDaysUntilTravel(request: RequestForCalculation): number | null {
  if (!request.travel_start_date) return null;

  const travelDate = new Date(request.travel_start_date);
  const now = new Date();
  const diffTime = travelDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if request is urgent (less than 14 days until travel)
 */
export function isUrgentByDate(request: RequestForCalculation): boolean {
  const daysUntil = calculateDaysUntilTravel(request);
  if (daysUntil === null) return false;
  return daysUntil < 14 && daysUntil >= 0;
}

/**
 * Get urgency badge level
 */
export function getUrgencyBadge(request: RequestForCalculation): {
  level: "urgent" | "high" | "normal" | "overdue";
  label: string;
  color: string;
} {
  // Check if marked as urgent
  if (request.is_urgent) {
    return {
      level: "urgent",
      label: "Urgent",
      color: "bg-red-100 text-red-800 border-red-200",
    };
  }

  // Check if overdue (travel date passed)
  const daysUntil = calculateDaysUntilTravel(request);
  if (daysUntil !== null && daysUntil < 0) {
    return {
      level: "overdue",
      label: "Overdue",
      color: "bg-red-100 text-red-800 border-red-200",
    };
  }

  // Check if less than 14 days until travel
  if (daysUntil !== null && daysUntil < 14 && daysUntil >= 0) {
    return {
      level: "high",
      label: "High Priority",
      color: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }

  // Check if pending for more than 1 day
  if (isPendingLongTime(request)) {
    return {
      level: "high",
      label: "Pending Long",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }

  return {
    level: "normal",
    label: "Normal",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  };
}

/**
 * Get international/local badge
 */
export function getInternationalBadge(request: RequestForCalculation): {
  label: string;
  color: string;
} {
  if (request.is_international) {
    return {
      label: "International",
      color: "bg-blue-100 text-blue-800 border-blue-200",
    };
  }
  return {
    label: "Local",
    color: "bg-green-100 text-green-800 border-green-200",
  };
}

