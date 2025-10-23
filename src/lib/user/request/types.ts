export type Reason =
  | "official"        // Official business
  | "ces"             // CES
  | "seminar"         // Seminar / Training / Meeting
  | "educational"     // Educational Trip
  | "competition"     // Competition
  | "visit";          // Visit / Coordination

export type VehicleMode = "institutional" | "owned" | "rent";
export type RequesterRole = "faculty" | "head" | "org";

/** Source of truth for UI choices (readonly/frozen) */
export const REASON_OPTIONS = [
  { label: "Official business", value: "official" },
  { label: "CES", value: "ces" },
  { label: "Seminar / Training", value: "seminar" },
  { label: "Educational Trip", value: "educational" },
  { label: "Competition", value: "competition" },
  { label: "Visit", value: "visit" },
] as const satisfies ReadonlyArray<{ label: string; value: Reason }>;

/**
 * Map of reason → label for convenient imports.
 * Example: reasonLabel["seminar"] === "Seminar / Training"
 */
export const reasonLabel: Record<Reason, string> = REASON_OPTIONS
  .reduce((acc, o) => {
    acc[o.value] = o.label;
    return acc;
  }, {} as Record<Reason, string>);

/* ---------- Travel Order ---------- */

export type TravelCosts = {
  food?: number | null;
  driversAllowance?: number | null;
  rentVehicles?: number | null;
  hiredDrivers?: number | null;
  accommodation?: number | null;
  otherLabel?: string;
  otherAmount?: number | null;
  justification?: string;
};

export interface TravelOrder {
  date: string;
  requestingPerson: string;
  /** Base department text (no auto-abbrev stored here) */
  department: string;
  destination: string;
  destinationGeo?: { lat: number; lng: number } | null;
  departureDate: string;
  returnDate: string;
  purposeOfTravel: string;
  costs: TravelCosts;

  /** NEW: Requesting person e-signature (data URL) */
  requesterSignature?: string;

  /** Endorser (department head) signature area */
  endorsedByHeadName?: string;
  endorsedByHeadDate?: string;
  endorsedByHeadSignature?: string; // data URL
}

/* ---------- School Service (only for institutional) ---------- */

export interface SchoolService {
  driver: string;
  vehicle: string;
  vehicleDispatcherSigned?: boolean;
  vehicleDispatcherDate?: string;
}

/* ---------- Seminar Application ---------- */

export type SeminarFees = {
  registrationFee?: number | null;
  totalAmount?: number | null;
};

export type SeminarBreakdown = {
  registration?: number | null;
  accommodation?: number | null;
  perDiemMealsDriversAllowance?: number | null;
  transportFareGasParkingToll?: number | null;
  otherLabel?: string;
  otherAmount?: number | null;
};

export interface SeminarApplication {
  applicationDate: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  typeOfTraining: string[];
  trainingCategory?: "local" | "regional" | "national" | "international" | "";
  sponsor?: string;
  venue?: string;
  venueGeo?: { lat: number; lng: number } | null;
  modality?: "Onsite" | "Online" | "Hybrid" | "";
  fees?: SeminarFees;
  breakdown?: SeminarBreakdown;
  makeUpClassSchedule?: string;
  applicantUndertaking?: boolean;
  fundReleaseLine?: number | null;
}

/* ---------- Whole request ---------- */

export interface RequestFormData {
  requesterRole: RequesterRole;
  reason: Reason;
  vehicleMode: VehicleMode;
  travelOrder: TravelOrder;
  schoolService?: SchoolService;
  seminar?: SeminarApplication;
}
