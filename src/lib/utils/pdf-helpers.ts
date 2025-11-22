/**
 * PDF Helper Functions
 * Utilities for PDF generation including name formatting and initials extraction
 */

/**
 * Extract initials from a name
 * Examples:
 * - "Ms. Sylvia" → "MS"
 * - "C. O. Ortiz" → "COO"
 * - "John Doe" → "JD"
 * - "Maria Santos" → "MS"
 */
export function extractInitials(name: string | null | undefined): string {
  if (!name) return "UNKNOWN";

  // Remove common prefixes
  let cleaned = name
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sir|Ma'am|Maam)\s+/i, "")
    .trim();

  // Split by spaces and get first letter of each word
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0) return "UNKNOWN";

  // If name has periods (like "C. O. Ortiz"), extract letters before periods
  if (cleaned.includes(".")) {
    const matches = cleaned.match(/\b([A-Z])\./g);
    if (matches && matches.length > 0) {
      return matches
        .map((m) => m.replace(".", ""))
        .join("")
        .toUpperCase();
    }
  }

  // Get first letter of each significant word (ignore single letters unless it's the only word)
  const initials = words
    .map((word) => {
      // Get first letter, handling special characters
      const firstChar = word.charAt(0).toUpperCase();
      return /[A-Z]/.test(firstChar) ? firstChar : "";
    })
    .filter((char) => char.length > 0);

  // If we have initials, return them (max 3)
  if (initials.length > 0) {
    return initials.slice(0, 3).join("");
  }

  // Fallback: return first 2-3 characters uppercase
  return cleaned.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Format PDF filename
 * Format: TO-2025-{request_number}-{initials}.pdf
 * For seminars: SA-2025-{number}-{initials}.pdf
 */
export function formatPDFFilename(
  requestNumber: string | null | undefined,
  requesterName: string | null | undefined,
  requestType: "travel_order" | "seminar" | string | null | undefined
): string {
  const prefix = requestType === "seminar" ? "SA" : "TO";
  const year = new Date().getFullYear();
  const number = requestNumber || "UNKNOWN";
  const initials = extractInitials(requesterName);

  // Extract just the number part if request_number includes prefix (e.g., "TO-2025-001" → "001")
  const numberPart = number.includes("-")
    ? number.split("-").pop() || number
    : number;

  return `${prefix}-${year}-${numberPart}-${initials}.pdf`;
}

/**
 * Format timestamp for PDF display
 * Format: "Approved on [date] at [time] AM/PM"
 */
export function formatApprovalTimestamp(
  timestamp: string | Date | null | undefined
): string {
  if (!timestamp) return "Pending";

  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;

  // Use Philippines timezone (PHT = UTC+8)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const formatted = new Intl.DateTimeFormat("en-US", options).format(date);

  // Format: "Approved on November 22, 2025 at 3:17 AM"
  return `Approved on ${formatted}`;
}

/**
 * Get user title and department for PDF display
 */
export interface UserInfo {
  name: string;
  title?: string;
  department?: string;
  position?: string;
}

export function formatApproverInfo(user: UserInfo | null | undefined): string {
  if (!user || !user.name) return "Pending";

  const parts: string[] = [user.name];

  if (user.title) {
    parts.push(user.title);
  } else if (user.position) {
    parts.push(user.position);
  }

  if (user.department) {
    parts.push(user.department);
  }

  return parts.join("\n");
}

