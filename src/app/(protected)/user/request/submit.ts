// src/app/(protected)/user/request/submit.ts (example file where you handle submit)
"use client";
import { addToInbox } from "@/lib/common/inbox";
import type { RequestFormData } from "@/lib/user/request/types";

export async function submitRequest(data: RequestFormData) {
  // shape a lightweight row for Admin table
  const item = {
    dept: data.travelOrder.department,
    purpose: data.travelOrder.purposeOfTravel,
    requester: data.travelOrder.requestingPerson,
    vehicle: data.vehicleMode === "institutional" ? "Institutional" :
             data.vehicleMode === "owned" ? "Owned" : "Rent",
    date: data.travelOrder.date,
  };

  const id = addToInbox(item);

  // …any user-side toasts/redirects
  return id;
}
