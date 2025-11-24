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
    isHeadRequester?: boolean; // If head is the requester, their head signature counts as requester signature
    currentUserName?: string;
    requestingPersonName?: string;
    allRequestersConfirmed?: boolean; // For multiple requesters
    allParticipantsConfirmed?: boolean; // For seminar participants
    allHeadEndorsementsConfirmed?: boolean; // For head endorsements (multi-department)
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
      // Debug: Only log if there's a mismatch (not every call)
    }
  }
  
  // Reduced logging - only log validation failures, not every call
  // Uncomment for debugging if needed:
  // console.log('[Validation] canSubmit called', { reason: data.reason, isRepresentative });

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
    // BUT: Skip if:
    // 1. This is a representative submission (requester will sign later via inbox)
    // 2. Head is the requester (their head signature counts as requester signature - dual-signature logic)
    const isHeadRequester = options?.isHeadRequester ?? false;
    
    if (!isRepresentative && !isHeadRequester && !hasSignature(s.requesterSignature)) {
      errors["seminar.requesterSignature"] = "Requesting person's signature is required";
    }
    
    // ✅ VALIDATION: All participants must be confirmed before submitting
    if (options?.allParticipantsConfirmed === false) {
      errors["seminar.participants"] = "All invited participants must confirm their participation before submitting. Please wait for all participants to confirm or remove pending invitations.";
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
    // BUT: Skip if:
    // 1. This is a representative submission (requester will sign later via inbox)
    // 2. Head is the requester (their head signature counts as requester signature - dual-signature logic)
    const isHeadRequester = options?.isHeadRequester ?? false;
    const hasHeadSignature = hasSignature(to.endorsedByHeadSignature);
    
    if (!isRepresentative && !isHeadRequester && !hasSignature(to.requesterSignature)) {
      errors["travelOrder.requesterSignature"] = "Requesting person's signature is required";
    }
    
    // For head requesters: their head signature should count as requester signature
    // BUT: Skip this check if all head endorsements are confirmed (multi-department scenario)
    // In multi-department scenarios, head signatures are stored in head_endorsement_invitations table,
    // not in the form field, so we rely on allHeadEndorsementsConfirmed flag
    const allHeadEndorsementsConfirmed = options?.allHeadEndorsementsConfirmed;
    
    // Only require head signature if:
    // 1. Head is requester AND
    // 2. Not all head endorsements are confirmed (single department or multi-department not yet confirmed) AND
    // 3. No head signature in form field
    if (isHeadRequester && allHeadEndorsementsConfirmed !== true && !hasHeadSignature) {
      errors["travelOrder.endorsedByHeadSignature"] = "Please provide your signature as the department head. Since you are the requesting person, your signature is required before submission.";
    }

    // Note: Head signature is NOT required for initial submission
    // Head will sign AFTER reviewing the request
    
    // ✅ VALIDATION: All requesters must be confirmed before submitting (for multiple requesters)
    if (options?.allRequestersConfirmed === false) {
      errors["travelOrder.requesters"] = "All requesters must be invited and confirm their participation with a signature before you can submit. Please send invitations to all requesters and wait for their confirmations.";
    }

    // ✅ VALIDATION: All head endorsements must be confirmed before submitting (for multi-department scenarios)
    if (options?.allHeadEndorsementsConfirmed === false) {
      errors["travelOrder.headEndorsements"] = "All department heads must confirm their endorsements before submission. Check the status in the 'Head Endorsements' section below.";
    }

    const needsJustif =
      data.vehicleMode === "rent" ||
      Number(c.rentVehicles || 0) > 0 ||
      Number(c.hiredDrivers || 0) > 0;

    if (needsJustif && !req((c as any).justification)) {
      errors["travelOrder.costs.justification"] =
        "Please provide a justification for renting / hiring.";
    }

    // Validate contact number if pickup is required (pickup or gymnasium)
    const transportation = data.transportation;
    const pickupPreference = transportation?.pickup_preference;
    if (pickupPreference === "pickup" || pickupPreference === "gymnasium") {
      const contactNumber = transportation?.pickup_contact_number;
      if (!req(contactNumber)) {
        errors["transportation.pickup_contact_number"] = "Contact number is required for driver coordination";
      } else {
        // Validate phone number format (Philippines: +63XXXXXXXXXX or 09XXXXXXXXX)
        const cleaned = String(contactNumber).replace(/[\s\-\(\)]/g, '');
        const phMobileRegex = /^(\+63|0)?9\d{9}$/;
        if (!phMobileRegex.test(cleaned)) {
          errors["transportation.pickup_contact_number"] = "Please enter a valid Philippines mobile number (e.g., +639123456789 or 09123456789)";
        }
      }
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
