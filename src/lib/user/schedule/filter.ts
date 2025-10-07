import type { Trip, Status } from "./types";

export type FilterState = {
  status: Status | "All";
  vehicle: string | "All";
  query: string;
};

export function applyFilters(list: Trip[], { status, vehicle, query }: FilterState) {
  const q = query.trim().toLowerCase();
  return list
    .filter((t) => (status === "All" ? true : t.status === status))
    .filter((t) => (vehicle === "All" ? true : t.vehicle === vehicle))
    .filter((t) =>
      q
        ? [t.destination, t.department, t.vehicle, t.id]
            .join(" ")
            .toLowerCase()
            .includes(q)
        : true
    );
}
