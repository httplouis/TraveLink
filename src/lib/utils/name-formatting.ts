/**
 * Utility functions for formatting names
 */

const TITLES = ['dr.', 'atty.', 'engr.', 'prof.', 'mr.', 'mrs.', 'ms.', 'miss'];

/**
 * Removes common titles from the beginning of a name
 * Examples:
 * - "Dr. Benilda Villenas" -> "Benilda Villenas"
 * - "Atty. Dario R. Opistan" -> "Dario R. Opistan"
 * - "Dr. Maria Enverga" -> "Maria Enverga"
 */
export function removeTitleFromName(name: string): string {
  if (!name) return name;
  
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  
  // Check if first word is a title (case-insensitive)
  if (words.length > 0) {
    const firstWord = words[0].toLowerCase().replace(/\.$/, ''); // Remove trailing period
    if (TITLES.includes(firstWord)) {
      // Remove the title and return the rest
      return words.slice(1).join(' ');
    }
  }
  
  return trimmed;
}

/**
 * Gets the first name from a full name, skipping titles
 * Examples:
 * - "Dr. Benilda Villenas" -> "Benilda"
 * - "Atty. Dario R. Opistan" -> "Dario"
 */
export function getFirstName(name: string): string {
  const nameWithoutTitle = removeTitleFromName(name);
  const words = nameWithoutTitle.split(/\s+/);
  return words[0] || nameWithoutTitle;
}

/**
 * Gets the display name (full name without title)
 * Examples:
 * - "Dr. Benilda Villenas" -> "Benilda Villenas"
 * - "Atty. Dario R. Opistan" -> "Dario R. Opistan"
 */
export function getDisplayName(name: string): string {
  return removeTitleFromName(name);
}

