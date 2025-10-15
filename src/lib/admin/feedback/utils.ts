// src/lib/admin/feedback/utils.ts
import type { Feedback } from "./types";

/** Simple text search across common fields */
export function searchFeedback(rows: Feedback[], q: string): Feedback[] {
  const s = (q || "").trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((f) => {
    const hay = `${f.user} ${f.message} ${f.status} ${new Date(f.createdAt).toLocaleString()}`.toLowerCase();
    return hay.includes(s);
  });
}

export type SortKey = "newest" | "oldest" | "ratingHigh" | "ratingLow";
export function sortFeedback(rows: Feedback[], key: SortKey): Feedback[] {
  const arr = [...rows];
  switch (key) {
    case "newest":
      return arr.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    case "oldest":
      return arr.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    case "ratingHigh":
      return arr.sort((a, b) => ((b.rating ?? -1) - (a.rating ?? -1)));
    case "ratingLow":
      return arr.sort((a, b) => ((a.rating ?? Infinity) - (b.rating ?? Infinity)));
    default:
      return arr;
  }
}

export function filterByStatus(rows: Feedback[], status: "NEW" | "REVIEWED" | "RESOLVED" | "ALL" = "ALL") {
  if (status === "ALL") return rows;
  return rows.filter((f) => f.status === status);
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { pageRows: rows.slice(start, end), total };
}

/** Quick KPIs if you want a small header widget */
export function computeFeedbackKpis(rows: Feedback[]) {
  const total = rows.length;
  const newCount = rows.filter((r) => r.status === "NEW").length;
  const reviewed = rows.filter((r) => r.status === "REVIEWED").length;
  const resolved = rows.filter((r) => r.status === "RESOLVED").length;
  const avgRating =
    rows.length ? Math.round((rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length) * 10) / 10 : 0;
  return { total, newCount, reviewed, resolved, avgRating };
}
