// src/lib/user/request/types.ts

export type Reason = "seminar" | "educational" | "competition" | "visit";
export type VehicleMode = "institutional" | "owned" | "rent";
export type RequesterRole = "head" | "faculty" | "org";

/** Optional geo data saved when picking from the map */
export type GeoPoint = { lat: number; lng: number; address?: string };

/** NEW: repeatable "other costs" item */
export type OtherCostItem = {
  label: string;
  amount: number | null;
};

export type TravelCosts = {
  food?: number | null;
  driversAllowance?: number | null;
  rentVehicles?: number | null;
  hiredDrivers?: number | null;
  accommodation?: number | null;

  /**
   * NEW preferred structure (repeatable list).
   * UI should write here going forward.
   */
  otherItems?: OtherCostItem[];

  /**
   * Legacy single-pair fields (kept for old drafts, still optional).
   * UI can read then migrate these into `otherItems`.
   */
  otherLabel?: string | null;
  otherAmount?: number | null;

  justification?: string | null;
};

export type TravelOrder = {
  date: string;
  requestingPerson: string;
  department: string;

  /** Human-readable destination; filled by user or from the map picker */
  destination: string;
  /** Optional coordinates from the map picker */
  destinationGeo?: GeoPoint | null;

  departureDate: string;
  returnDate: string;
  purposeOfTravel: string;
  costs: TravelCosts;

  endorsedByHeadName?: string | null;
  endorsedByHeadDate?: string | null;
};

export type SchoolService = {
  driver: string;
  vehicle: string;
  vehicleDispatcherSigned: boolean;
  vehicleDispatcherDate: string;
};

export type SeminarApplication = {
  applicationDate: string;
  title: string;
  typeOfTraining?: string[];
  trainingCategory?: "local" | "regional" | "national" | "international";
  dateFrom: string;
  dateTo: string;
  days?: number | null;
  sponsor?: string | null;

  /** Human-readable venue; filled by user or from the map picker */
  venue?: string | null;
  /** Optional coordinates from the map picker */
  venueGeo?: GeoPoint | null;

  modality?: string | null;
  fees?: { registrationFee?: number | null; totalAmount?: number | null };
  breakdown?: {
    registration?: number | null;
    accommodation?: number | null;
    perDiemMealsDriversAllowance?: number | null;
    transportFareGasParkingToll?: number | null;

    /** NEW: repeatable "other" cost lines for seminars */
    otherItems?: OtherCostItem[];

    /** Legacy single-pair (kept for back-compat) */
    otherLabel?: string | null;
    otherAmount?: number | null;
  };
  makeUpClassSchedule?: string | null;
  applicantUndertaking?: boolean;
  applicants?: Array<{
    name: string;
    availableFDP?: string | null;
    departmentOffice?: string | null;
    signature?: string | null;
  }>;
  fundReleaseLine?: number | null;
};

export type RequestFormData = {
  requesterRole: RequesterRole;
  reason: Reason;
  vehicleMode: VehicleMode;
  travelOrder: TravelOrder;
  schoolService?: SchoolService;
  seminar?: SeminarApplication;
};
