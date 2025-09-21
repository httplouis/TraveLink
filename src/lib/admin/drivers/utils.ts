import type { Driver } from "./types";

export function toCSV(rows: Driver[]) {
  const headers = [
    "id",
    "code",
    "firstName",
    "lastName",
    "phone",
    "email",
    "status",
    "hireDate",
    "licenseNo",
    "licenseClass",
    "licenseExpiryISO",
    "assignedVehicleId",
    "lastCheckIn",
    "rating",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as any)[h])).join(",")),
  ];
  return lines.join("\n");
}

export function validate(d: Partial<Driver>): string | null {
  if (!d.firstName) return "First name is required.";
  if (!d.lastName) return "Last name is required.";
  if (!d.code) return "Driver code is required.";
  if (!d.licenseNo) return "License number is required.";
  if (!d.licenseClass) return "License class is required.";
  if (!d.licenseExpiryISO) return "License expiry date is required.";

  // simple expiry check
  try {
    const exp = new Date(d.licenseExpiryISO);
    const today = new Date();
    if (isNaN(exp.getTime())) return "License expiry date is invalid.";
    // allow same-day; only error if clearly in the past by date
    const expDate = new Date(exp.toISOString().slice(0, 10));
    const todayDate = new Date(today.toISOString().slice(0, 10));
    if (expDate < todayDate) {
      // still allow saving; just return null—your UI can show warnings instead
      // return "License already expired.";
    }
  } catch {}

  // basic email/phone checks (optional)
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return "Invalid email.";
  if (d.phone && !/^[0-9+\-\s()]+$/.test(d.phone)) return "Invalid phone number.";

  return null;
}

export function isLicenseExpired(iso: string) {
  const exp = new Date(iso);
  const today = new Date();
  const expDate = new Date(exp.toISOString().slice(0, 10));
  const todayDate = new Date(today.toISOString().slice(0, 10));
  return expDate < todayDate;
}

export function isLicenseExpiringSoon(iso: string, days = 30) {
  const exp = new Date(iso);
  const today = new Date();
  const soon = new Date(today);
  soon.setDate(soon.getDate() + days);
  const expDate = new Date(exp.toISOString().slice(0, 10));
  const soonDate = new Date(soon.toISOString().slice(0, 10));
  return expDate >= today && expDate <= soonDate;
}
