import type { RequestFormData } from "@/lib/user/request/types";

type Errors = Record<string, string>;

function req(v: unknown) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  return Boolean(v);
}

// ✅ consider an actually saved signature (not blank 1x1, etc.)
function hasSignature(sig?: string | null): boolean {
  if (!sig) return false;
  const s = String(sig).trim();
  if (!s.startsWith("data:image")) return false;
  // very tiny base64 images are usually “blank” pads — guard it
  return s.length > 3000;
}

export function canSubmit(data: RequestFormData) {
  const errors: Errors = {};
  const to = (data.travelOrder ?? {}) as NonNullable<RequestFormData["travelOrder"]>;
  const c = (to.costs ?? {}) as NonNullable<typeof to["costs"]>;

  if (!req(to.date)) errors["travelOrder.date"] = "Required";
  if (!req(to.requestingPerson)) errors["travelOrder.requestingPerson"] = "Required";
  if (!req(to.department)) errors["travelOrder.department"] = "Required";
  if (!req(to.destination)) errors["travelOrder.destination"] = "Required";
  if (!req(to.departureDate)) errors["travelOrder.departureDate"] = "Required";
  if (!req(to.returnDate)) errors["travelOrder.returnDate"] = "Required";
  if (!req(to.purposeOfTravel)) errors["travelOrder.purposeOfTravel"] = "Required";

  // ✅ REQUIRED: signature must be saved (and not blank)
  if (!hasSignature(to.endorsedByHeadSignature)) {
    errors["travelOrder.endorsedByHeadSignature"] = "Endorser signature is required.";
  }

  const needsJustif =
    data.vehicleMode === "rent" ||
    Number(c.rentVehicles || 0) > 0 ||
    Number(c.hiredDrivers || 0) > 0;

  if (needsJustif && !req((c as any).justification)) {
    errors["travelOrder.costs.justification"] =
      "Please provide a justification for renting / hiring.";
  }

  if (data.reason === "seminar" && data.seminar) {
    const s = data.seminar!;
    if (!req(s.applicationDate)) errors["seminar.applicationDate"] = "Required";
    if (!req(s.title)) errors["seminar.title"] = "Required";
    if (!req(s.dateFrom)) errors["seminar.dateFrom"] = "Required";
    if (!req(s.dateTo)) errors["seminar.dateTo"] = "Required";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
