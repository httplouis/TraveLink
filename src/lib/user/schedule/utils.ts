import { Trip, DayStatus } from "./types";

export function getTripsForDay(trips: Trip[], day: Date): Trip[] {
  return trips.filter((t) => {
    const tripDate = new Date(t.start);
    return tripDate.toDateString() === day.toDateString();
  });
}

export function getDayStatus(trips: Trip[], day: Date): DayStatus {
  const tripsForDay = getTripsForDay(trips, day);
  const count = tripsForDay.length;

  if (count === 0) return "available";
  if (count < 3) return "partial";
  return "full";
}
