import type { Driver } from "./types";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const isExpired = (iso: string) => {
  if (!iso) return true;
  const d = new Date(iso + "T00:00:00");
  const t = new Date(todayISO() + "T00:00:00");
  return d.getTime() < t.getTime();
};

export const daysUntil = (iso: string) => {
  const t = new Date(todayISO() + "T00:00:00").getTime();
  const d = new Date(iso + "T00:00:00").getTime();
  return Math.ceil((d - t) / (1000 * 60 * 60 * 24));
};

export const complianceState = (d: Driver): "ok" | "warn" | "bad" => {
  const licenseDays = daysUntil(d.license.expiry);
  if (licenseDays < 0) return "bad";
  if (licenseDays <= 30) return "warn";
  return "ok";
};

export const complianceInfo = (d: import("./types").Driver) => {
  const state = complianceState(d); // "ok" | "warn" | "bad"
  const className =
    state === "ok"
      ? "bg-green-100 text-green-700"
      : state === "warn"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  const label = state === "ok" ? "Compliant" : state === "warn" ? "Expiring soon" : "Expired";
  return { state, className, label };
};