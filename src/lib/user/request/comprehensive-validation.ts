// src/lib/user/request/comprehensive-validation.ts

/**
 * Comprehensive validation utilities for travel request forms
 * Includes date validation, required fields, and business logic rules
 */

/**
 * Check if a date is in the past
 */
export function isDateInPast(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  return date < today;
}

/**
 * Check if end date is before start date
 */
export function isEndBeforeStart(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return new Date(endDate) < new Date(startDate);
}

/**
 * Validate date field - cannot be in the past
 */
export function validateDateNotPast(date: string, fieldName: string = "Date"): string | null {
  if (!date) return `${fieldName} is required. Please select a date.`;
  if (isDateInPast(date)) {
    return `${fieldName} must be today or a future date. Please select a valid date.`;
  }
  return null;
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
  startLabel: string = "Start date",
  endLabel: string = "End date"
): { startError?: string; endError?: string } {
  const errors: { startError?: string; endError?: string } = {};

  if (!startDate) {
    errors.startError = `${startLabel} is required. Please select a date.`;
  } else if (isDateInPast(startDate)) {
    errors.startError = `${startLabel} must be today or a future date. Please select a valid date.`;
  }

  if (!endDate) {
    errors.endError = `${endLabel} is required. Please select a date.`;
  } else if (isDateInPast(endDate)) {
    errors.endError = `${endLabel} must be today or a future date. Please select a valid date.`;
  }

  if (startDate && endDate && isEndBeforeStart(startDate, endDate)) {
    errors.endError = `${endLabel} must be on or after the ${startLabel.toLowerCase()}. Please check your dates.`;
  }

  return errors;
}

/**
 * Validate required text field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  return null;
}

/**
 * Validate destination field (must have selection)
 */
export function validateDestination(destination: string): string | null {
  if (!destination || destination.trim() === "") {
    return "Destination is required. Please select from map or enter address.";
  }
  return null;
}

/**
 * Validate budget justification
 */
export function validateBudgetJustification(
  costs: any,
  justification: string
): string | null {
  if (!costs) return null;
  
  const hasCosts = Object.keys(costs).some(key => {
    const val = costs[key];
    return val && parseFloat(val) > 0;
  });

  if (hasCosts && (!justification || justification.trim() === "")) {
    return "Budget justification is required when requesting funds";
  }

  return null;
}

/**
 * Validate signature (image data URL)
 */
export function validateSignature(signature: string | null, fieldName: string = "Signature"): string | null {
  if (!signature || signature.trim() === "") {
    return `${fieldName} is required`;
  }
  // Check if it's a valid data URL
  if (!signature.startsWith("data:image/")) {
    return `${fieldName} must be a valid image`;
  }
  return null;
}

/**
 * Validate phone number (optional but if provided must be valid)
 */
export function validatePhone(phone: string): string | null {
  if (!phone) return null; // Optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone) || phone.length < 7) {
    return "Invalid phone number format";
  }
  return null;
}

/**
 * Comprehensive validation for travel order form
 */
export function validateTravelOrderForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};

  // Date validation
  const dateError = validateDateNotPast(data.date, "Request date");
  if (dateError) errors["travelOrder.date"] = dateError;

  // Departure and return dates
  const dateRangeErrors = validateDateRange(
    data.departureDate,
    data.returnDate,
    "Departure date",
    "Return date"
  );
  if (dateRangeErrors.startError) errors["travelOrder.departureDate"] = dateRangeErrors.startError;
  if (dateRangeErrors.endError) errors["travelOrder.returnDate"] = dateRangeErrors.endError;

  // Required fields
  const requesterError = validateRequired(data.requestingPerson, "Requesting person");
  if (requesterError) errors["travelOrder.requestingPerson"] = requesterError;

  const deptError = validateRequired(data.department, "Department");
  if (deptError) errors["travelOrder.department"] = deptError;

  const destError = validateDestination(data.destination);
  if (destError) errors["travelOrder.destination"] = destError;

  const purposeError = validateRequired(data.purposeOfTravel, "Purpose of travel");
  if (purposeError) errors["travelOrder.purposeOfTravel"] = purposeError;

  // Budget justification if costs are present
  const justifError = validateBudgetJustification(data.costs, data.costs?.justification);
  if (justifError) errors["travelOrder.costs.justification"] = justifError;

  // Head endorsement (if required based on role)
  if (data.endorsedByHeadName) {
    const headDateError = validateDateNotPast(data.endorsedByHeadDate, "Endorsement date");
    if (headDateError) errors["travelOrder.endorsedByHeadDate"] = headDateError;
  }

  return errors;
}

/**
 * Validate seminar application form
 */
export function validateSeminarForm(data: any): Record<string, string> {
  const errors: Record<string, string> = {};

  const appDateError = validateDateNotPast(data.applicationDate, "Application date");
  if (appDateError) errors["seminar.applicationDate"] = appDateError;

  const titleError = validateRequired(data.title, "Seminar title");
  if (titleError) errors["seminar.title"] = titleError;

  const dateRangeErrors = validateDateRange(data.dateFrom, data.dateTo, "Start date", "End date");
  if (dateRangeErrors.startError) errors["seminar.dateFrom"] = dateRangeErrors.startError;
  if (dateRangeErrors.endError) errors["seminar.dateTo"] = dateRangeErrors.endError;

  return errors;
}
