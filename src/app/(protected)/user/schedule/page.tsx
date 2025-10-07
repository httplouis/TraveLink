import ScheduleView from "@/features/user/schedule/ScheduleView";
import { MOCK_TRIPS } from "@/lib/user/schedule/mock"; // dev only

export default async function UserSchedulePage() {
  // For now dev mock; later:
  // const trips = await fetchTrips();
  return <ScheduleView trips={MOCK_TRIPS} />;
}
