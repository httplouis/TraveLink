export type VehicleType = "Bus" | "Van" | "Car" | "SUV" | "Motorcycle";
export type VehicleStatus = "active" | "maintenance" | "inactive";


export interface Vehicle {
id: string;
plateNo: string;
code: string;
brand: string;
model: string;
type: VehicleType;
capacity: number;
status: VehicleStatus;
odometerKm: number;
lastServiceISO: string;
notes?: string;
createdAt: string;
updatedAt: string;
}


export type VehicleFilters = {
search?: string;
type?: VehicleType | "";
status?: VehicleStatus | "";
};