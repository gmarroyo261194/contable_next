import { auth } from "@/auth";
import LandingPage from "@/components/landing/LandingPage";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  return <DashboardClient />;
}
