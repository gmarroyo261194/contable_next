import React from "react";
import { getDocentes, getTiposEntidad } from "../entidades/actions";
import { EntidadClient } from "../entidades/EntidadClient";
import { getCuentas } from "@/lib/actions/asiento-actions";

export default async function DocentesPage() {
  const [docentes, tipos, cuentas] = await Promise.all([
    getDocentes(),
    getTiposEntidad(),
    getCuentas()
  ]);

  return (
    <div className="p-8">
      <EntidadClient 
        initialEntidades={docentes} 
        tipos={tipos} 
        cuentas={cuentas} 
        title="Gestión de Docentes"
        description="Administra los docentes registrados en el sistema"
        hideEmpresa={true}
      />
    </div>
  );
}
