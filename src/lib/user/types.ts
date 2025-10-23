export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: string;
  role?: "Faculty" | "Driver" | "Admin" | "Staff";
  employeeId?: string;
  joinedAt?: string;
  avatarUrl?: string | null;
  prefs?: { theme?: "system" | "light" | "dark"; emailNotifications?: boolean };
};
