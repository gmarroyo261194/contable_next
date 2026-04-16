"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCentrosCosto } from "@/lib/actions/centro-costo-actions";
import { getCuentasParaReporte } from "@/lib/actions/reportes-actions";
import { CentrosCostoClient } from "./CentrosCostoClient";

export default async function CentrosCostoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const empresaId = (session.user as any).empresaId;
  const ejercicioId = (session.user as any).ejercicioId;

  if (!empresaId || !ejercicioId) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl mx-auto max-w-2xl mt-10">
        <h2 className="text-xl font-bold text-slate-800">Seleccione una empresa y un ejercicio para continuar</h2>
      </div>
    );
  }

  const centros = await getCentrosCosto(empresaId);
  const cuentas = await getCuentasParaReporte(ejercicioId);

  return (
    <div className="p-8 max-w-screen-xl mx-auto">
       <CentrosCostoClient 
          initialCentros={JSON.parse(JSON.stringify(centros))} 
          cuentas={JSON.parse(JSON.stringify(cuentas.filter(c => c.imputable)))}
          empresaId={empresaId}
       />
    </div>
  );
}
