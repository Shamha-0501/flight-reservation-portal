import { RouteLoadingScreen } from "@/src/shared/components/common/RouteLoadingScreen";

export default function Loading() {
  return <RouteLoadingScreen title="Loading bookings" description="Fetching your booking history." variant="dashboard" />;
}
