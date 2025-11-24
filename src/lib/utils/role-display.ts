/**
 * Role Display Names
 * Centralized role display names for consistency
 */

export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: "Transportation Coordinator",
    administrator: "Transportation Coordinator",
    "Transportation Coordinator": "Transportation Coordinator",
    head: "Department Head",
    comptroller: "Comptroller",
    hr: "HR Manager",
    vp: "Vice President",
    president: "University President",
    executive: "Executive",
    faculty: "Faculty/Staff",
    staff: "Faculty/Staff",
    student: "Faculty/Staff", // Map student to Faculty/Staff
    user: "Faculty/Staff", // Default user role to Faculty/Staff
  };

  return roleMap[role.toLowerCase()] || "Faculty/Staff"; // Default to Faculty/Staff if role not found
}

export function getRoleBadgeLabel(isAdmin: boolean, isSuperAdmin?: boolean): string {
  if (isSuperAdmin) return "Super Admin";
  if (isAdmin) return "Transportation Coordinator";
  return "User";
}

