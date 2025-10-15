// What users are allowed to see (no photos, no license numbers, etc.)
export type VehiclePublic = {
  id: string;
  label: string;          // e.g., "HiAce 12-seater"
  plateMasked?: string;   // e.g., "ABC•123" or "•••123" (optional)
  capacity?: number;
  category?: string;      // Van, Bus, Sedan...
  availability: "available" | "in-use" | "maintenance";
  notes?: string | null;
};

export type DriverPublic = {
  id: string;
  nameMasked: string;     // show “J. Santos” or “Driver #102”
  phoneMasked?: string;   // e.g., "09•• ••• ••23"
  availability: "available" | "on-trip" | "off-duty";
  licenseMasked?: string; // optional; masked if you want
  seniority?: string;     // optional label (e.g. "Senior", "Reliever")
};
