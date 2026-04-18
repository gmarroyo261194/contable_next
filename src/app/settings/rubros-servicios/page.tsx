import { auth } from "@/auth";
import { getRubros } from "@/lib/actions/rubro-actions";
import { getDepartamentos } from "@/lib/actions/departamento-actions";
import { getServicios } from "@/lib/actions/servicio-actions";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { RubrosServiciosClient } from "./client-page";
import { redirect } from "next/navigation";

export default async function RubrosServiciosPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const empresaId = (session.user as any)?.empresaId;
  const ejercicioId = (session.user as any)?.ejercicioId;

  if (!empresaId || !ejercicioId) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">No hay selección activa</h2>
        <p className="text-slate-500 mt-2">Debe seleccionar una empresa y ejercicio para configurar los servicios.</p>
      </div>
    );
  }

  const [rubros, departamentos, servicios, cuentas] = await Promise.all([
    getRubros(),
    getDepartamentos(),
    getServicios(empresaId),
    getCuentas()
  ]);

  return (
    <RubrosServiciosClient 
      initialRubros={rubros}
      initialDepartamentos={departamentos}
      initialServicios={servicios}
      cuentas={cuentas}
      empresaId={empresaId}
    />
  );
}
