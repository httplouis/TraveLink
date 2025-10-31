export type RequestStatus =
  | "DRAFT"
  | "PENDING_HEAD"
  | "HEAD_APPROVED"
  | "HEAD_REJECTED"
  | "ADMIN_RECEIVED"
  | "SCHEDULED"
  | "CLOSED";

export const STATUS_FLOW: Record<RequestStatus, RequestStatus[]> = {
  DRAFT: ["PENDING_HEAD"],
  PENDING_HEAD: ["HEAD_APPROVED", "HEAD_REJECTED"],
  HEAD_APPROVED: ["ADMIN_RECEIVED"],
  HEAD_REJECTED: [],
  ADMIN_RECEIVED: ["SCHEDULED"],
  SCHEDULED: ["CLOSED"],
  CLOSED: [],
};
