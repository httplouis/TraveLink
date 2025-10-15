export const Brand = "#7a0019";

export const VEHICLE_TABS = [
  { key: "all", label: "All vehicles" },
  { key: "assigned", label: "Assigned" },
  { key: "out_of_order", label: "Out of order" },
  { key: "available", label: "Available for assign" },
  { key: "service_needed", label: "Service needed" },
] as const;

export type VehiclePrimaryTab = typeof VEHICLE_TABS[number]["key"];
