import type { AdminRequest } from "./store";
import type { RequestRow } from "@/lib/admin/types";

export function toRequestRow(req: AdminRequest): RequestRow {
  return {
    id: req.id,
    dept: (req.travelOrder?.department as RequestRow["dept"]) || "—",
    purpose: req.travelOrder?.purposeOfTravel || "—",
    requester: req.travelOrder?.requestingPerson || "—",
    driver: req.driver || "—",      // editable later
    vehicle: req.vehicle || "—",    // editable later
    date: req.createdAt,
    status:
      req.status === "pending"
        ? "Pending"
        : req.status === "approved"
        ? "Approved"
        : req.status === "rejected"
        ? "Rejected"
        : "Completed",
    raw: req, // keep full object para sa modal
  };
}
