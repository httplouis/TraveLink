import type { RequestFormData } from "./types";


export function canSubmit(d: RequestFormData): { ok: boolean; errors: Record<string,string> } {
const e: Record<string,string> = {};
if (!d.reason) e["reason"] = "Required";
if (!d.vehicleMode) e["vehicleMode"] = "Required";


const t = d.travelOrder || ({} as any);
if (!t.date) e["travelOrder.date"] = "Required";
if (!t.requestingPerson) e["travelOrder.requestingPerson"] = "Required";
if (!t.department) e["travelOrder.department"] = "Required";
if (!t.destination) e["travelOrder.destination"] = "Required";
if (!t.departureDate) e["travelOrder.departureDate"] = "Required";
if (!t.returnDate) e["travelOrder.returnDate"] = "Required";
if (!t.purposeOfTravel) e["travelOrder.purposeOfTravel"] = "Required";


if (d.vehicleMode === "institutional") {
const s = d.schoolService || ({} as any);
if (!s.driver) e["schoolService.driver"] = "Required";
if (!s.vehicle) e["schoolService.vehicle"] = "Required";
if (!s.vehicleDispatcherDate) e["schoolService.vehicleDispatcherDate"] = "Required";
}


const c = t.costs || {};
const rentOrHired = (Number(c.rentVehicles||0) > 0) || (Number(c.hiredDrivers||0) > 0);
if (d.vehicleMode === "rent" || rentOrHired) {
if (!c.justification || !c.justification.trim()) e["travelOrder.costs.justification"] = "Required for rent / hired";
}


if (d.reason === "seminar") {
const s = d.seminar || ({} as any);
if (!s.applicationDate) e["seminar.applicationDate"] = "Required";
if (!s.title) e["seminar.title"] = "Required";
if (!s.dateFrom) e["seminar.dateFrom"] = "Required";
if (!s.dateTo) e["seminar.dateTo"] = "Required";
}


return { ok: Object.keys(e).length === 0, errors: e };
}