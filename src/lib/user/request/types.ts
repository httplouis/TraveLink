export type Reason = "seminar" | "educational" | "competition" | "visit";
export type VehicleMode = "institutional" | "owned" | "rent";
export type RequesterRole = "head" | "faculty" | "org";


export type TravelCosts = {
food?: number | null;
driversAllowance?: number | null;
rentVehicles?: number | null;
hiredDrivers?: number | null;
accommodation?: number | null;
otherLabel?: string | null;
otherAmount?: number | null;
justification?: string | null;
};


export type TravelOrder = {
date: string;
requestingPerson: string;
department: string;
destination: string;
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
venue?: string | null;
modality?: string | null;
fees?: { registrationFee?: number | null; totalAmount?: number | null };
breakdown?: {
registration?: number | null;
accommodation?: number | null;
perDiemMealsDriversAllowance?: number | null;
transportFareGasParkingToll?: number | null;
otherLabel?: string | null;
otherAmount?: number | null;
};
makeUpClassSchedule?: string | null;
applicantUndertaking?: boolean;
applicants?: Array<{ name: string; availableFDP?: string | null; departmentOffice?: string | null; signature?: string | null }>;
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