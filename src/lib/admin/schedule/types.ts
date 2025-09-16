// src/lib/admin/schedule/types.ts
export type ScheduleStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
export type GeoPoint = { lat: number; lng: number };
export type PlaceRef = { address: string; placeId?: string | null; coords?: GeoPoint | null };
export type Driver = { id: string; name: string };
export type Vehicle = { id: string; label: string; plateNo: string };

export type Schedule = {
  id: string;
  tripId: string;          // 👈 NEW, immutable identifier like TRIP-20250916-0001
  requestId?: string | null;
  title: string;
  origin: string;
  destination: string;
  date: string;            // yyyy-mm-dd
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  driverId: string;
  vehicleId: string;
  status: ScheduleStatus;
  notes?: string;
  createdAt: string;  
  originPlace?: PlaceRef | null;
  destinationPlace?: PlaceRef | null; 
};

export type ScheduleFilters = {
  q: string;
  status: ScheduleStatus | "ALL";
  dateFrom?: string | null;
  dateTo?: string | null;
  driverId?: string | "ALL";
  vehicleId?: string | "ALL";
};

export type Pagination = { page: number; pageSize: number; total: number };
