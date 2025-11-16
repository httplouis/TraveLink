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

export function canSubmit(
  data: RequestFormData, 
  options?: { 
    isRepresentativeSubmission?: boolean;
    currentUserName?: string;
    requestingPersonName?: string;
  }
) {
  const errors: Errors = {};
  const to = (data.travelOrder ?? {}) as NonNullable<RequestFormData["travelOrder"]>;
  const c = (to.costs ?? {}) as NonNullable<typeof to["costs"]>;
  
  // Determine if representative submission:
  // 1. Use explicit flag if provided
  // 2. Fallback: compare names if both provided
  let isRepresentative = options?.isRepresentativeSubmission ?? false;
  
  // Fallback check: if names don't match, it's representative
  if (!isRepresentative && options?.currentUserName && options?.requestingPersonName) {
    const currentName = options.currentUserName.toLowerCase().trim();
    const requestingName = options.requestingPersonName.toLowerCase().trim();
    if (currentName !== requestingName) {
      isRepresentative = true;
      console.log('[Validation] 🔄 Fallback: Names don\'t match, treating as representative');
    }
  }
  
  console.log('[Validation] canSubmit called');
  console.log('  - reason:', data.reason);
  console.log('  - isRepresentativeSubmission (from flag):', options?.isRepresentativeSubmission);
  console.log('  - isRepresentativeSubmission (final):', isRepresentative);
  console.log('  - currentUserName:', options?.currentUserName);
  console.log('  - requestingPersonName:', options?.requestingPersonName || to.requestingPerson);
  console.log('  - hasSignature:', hasSignature(to.requesterSignature));

  // Helper function to check if date is in the past
  const isDateInPast = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Helper function to check if end date is before start date
  const isEndBeforeStart = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return end < start;
  };

  // Validate based on form type
  if (data.reason === "seminar" && data.seminar) {
    // SEMINAR FORM VALIDATION
    const s = data.seminar!;
    
    // Application date - required and cannot be in the past
    if (!req(s.applicationDate)) {
      errors["seminar.applicationDate"] = "Application date is required";
    } else if (isDateInPast(s.applicationDate)) {
      errors["seminar.applicationDate"] = "Application date cannot be in the past";
    }
    
    // Title - required
    if (!req(s.title)) {
      errors["seminar.title"] = "Seminar/Training title is required";
    }
    
    // Date From (Departure) - required, cannot be in past, must be before or equal to dateTo
    if (!req(s.dateFrom)) {
      errors["seminar.dateFrom"] = "Departure date is required";
    } else {
      if (isDateInPast(s.dateFrom)) {
        errors["seminar.dateFrom"] = "Departure date cannot be in the past";
      } else if (s.dateTo && isEndBeforeStart(s.dateFrom, s.dateTo)) {
        errors["seminar.dateFrom"] = "Departure date must be on or before the end date";
      }
    }
    
    // Date To (Return) - required, cannot be in past, must be after or equal to dateFrom
    if (!req(s.dateTo)) {
      errors["seminar.dateTo"] = "End date is required";
    } else {
      if (isDateInPast(s.dateTo)) {
        errors["seminar.dateTo"] = "End date cannot be in the past";
      } else if (s.dateFrom && isEndBeforeStart(s.dateFrom, s.dateTo)) {
        errors["seminar.dateTo"] = "End date must be on or after the departure date";
      }
    }
    
    // Venue - required
    if (!req(s.venue)) {
      errors["seminar.venue"] = "Venue is required";
    }
    
    // Modality - required
    if (!req(s.modality)) {
      errors["seminar.modality"] = "Modality is required";
    }
    
    // Type of Training - required
    if (!Array.isArray(s.typeOfTraining) || s.typeOfTraining.length === 0) {
      errors["seminar.typeOfTraining"] = "Type of training is required";
    }
    
    // Training Category - required
    if (!req(s.trainingCategory)) {
      errors["seminar.trainingCategory"] = "Training category is required";
    }
    
    // Applicants - at least one applicant required
    if (!Array.isArray(s.applicants) || s.applicants.length === 0) {
      errors["seminar.applicants"] = "At least one applicant is required";
    } else {
      // Validate each applicant
      s.applicants.forEach((app: any, index: number) => {
        if (!req(app.name)) {
          errors[`seminar.applicants.${index}.name`] = "Applicant name is required";
        }
        if (!req(app.department)) {
          errors[`seminar.applicants.${index}.department`] = "Applicant department is required";
        }
        // Signature is optional for applicants (they can sign later via invitation)
      });
    }
    
    // Breakdown - at least one expense item required
    if (!Array.isArray(s.breakdown) || s.breakdown.length === 0) {
      errors["seminar.breakdown"] = "At least one expense item is required";
    } else {
      // Validate each expense item
      s.breakdown.forEach((item: any, index: number) => {
        if (!req(item.label)) {
          errors[`seminar.breakdown.${index}.label`] = "Expense item name is required";
        }
        if (item.amount === null || item.amount === undefined || item.amount === 0) {
          errors[`seminar.breakdown.${index}.amount`] = "Expense amount is required";
        } else if (item.amount < 0) {
          errors[`seminar.breakdown.${index}.amount`] = "Expense amount cannot be negative";
        }
        // Justification is optional but recommended
      });
    }
    
    // ✅ REQUIRED: Requester signature must be saved (and not blank)
    // BUT: Skip if this is a representative submission (requester will sign later via inbox)
    if (!isRepresentative && !hasSignature(s.requesterSignature)) {
      errors["seminar.requesterSignature"] = "Requesting person's signature is required";
    }
    
  } else {
    // TRAVEL ORDER FORM VALIDATION
    if (!req(to.date)) errors["travelOrder.date"] = "Date is required";
    if (!req(to.requestingPerson)) errors["travelOrder.requestingPerson"] = "Requesting person is required";
    if (!req(to.department)) errors["travelOrder.department"] = "Department is required";
    if (!req(to.destination)) errors["travelOrder.destination"] = "Destination is required";
    
    // Departure date - required, cannot be in past, must be before or equal to return date
    if (!req(to.departureDate)) {
      errors["travelOrder.departureDate"] = "Departure date is required";
    } else {
      if (isDateInPast(to.departureDate)) {
        errors["travelOrder.departureDate"] = "Departure date cannot be in the past";
      } else if (to.returnDate && isEndBeforeStart(to.departureDate, to.returnDate)) {
        errors["travelOrder.departureDate"] = "Departure date must be on or before the return date";
      }
    }
    
    // Return date - required, cannot be in past, must be after or equal to departure date
    if (!req(to.returnDate)) {
      errors["travelOrder.returnDate"] = "Return date is required";
    } else {
      if (isDateInPast(to.returnDate)) {
        errors["travelOrder.returnDate"] = "Return date cannot be in the past";
      } else if (to.departureDate && isEndBeforeStart(to.departureDate, to.returnDate)) {
        errors["travelOrder.returnDate"] = "Return date must be on or after the departure date";
      }
    }
    
    if (!req(to.purposeOfTravel)) errors["travelOrder.purposeOfTravel"] = "Purpose of travel is required";

    // ✅ REQUIRED: Requester signature must be saved (and not blank)
    // BUT: Skip if this is a representative submission (requester will sign later via inbox)
    if (!isRepresentative && !hasSignature(to.requesterSignature)) {
      errors["travelOrder.requesterSignature"] = "Requesting person's signature is required";
    }

    // Note: Head signature is NOT required for initial submission
    // Head will sign AFTER reviewing the request

    const needsJustif =
      data.vehicleMode === "rent" ||
      Number(c.rentVehicles || 0) > 0 ||
      Number(c.hiredDrivers || 0) > 0;

    if (needsJustif && !req((c as any).justification)) {
      errors["travelOrder.costs.justification"] =
        "Please provide a justification for renting / hiring.";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
