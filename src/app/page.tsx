import { auth } from "@/auth";
import LandingPage from "@/components/landing/LandingPage";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { getDashboardStats } from "@/lib/actions/dashboard-actions";

/**
 * Página principal de la aplicación.
 * Si el usuario no está autenticado, muestra la Landing Page.
 * Si está autenticado, carga las estadísticas y muestra el Dashboard.
 * 
 * @returns {JSX.Element} La página de inicio correspondiente.
 */
export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  const stats = await getDashboardStats();

  return <DashboardClient stats={stats} />;
}
