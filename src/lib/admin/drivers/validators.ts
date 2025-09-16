import type { DriverCreate } from "./types";

export function validateDriver(input: DriverCreate) {
  if (!input.employeeNo.trim()) throw new Error("Employee # is required");
  if (!input.firstName.trim()) throw new Error("First name is required");
  if (!input.lastName.trim()) throw new Error("Last name is required");
  if (!/^\S+@\S+\.\S+$/.test(input.email)) throw new Error("Invalid email");
  if (!input.license.number.trim()) throw new Error("License number is required");
}
