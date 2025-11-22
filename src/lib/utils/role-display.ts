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
    faculty: "Faculty",
    user: "User",
  };

  return roleMap[role.toLowerCase()] || role;
}

export function getRoleBadgeLabel(isAdmin: boolean, isSuperAdmin?: boolean): string {
  if (isSuperAdmin) return "Super Admin";
  if (isAdmin) return "Transportation Coordinator";
  return "User";
}

