import React from "react";
import { getEntidades, getTiposEntidad } from "./actions";
import { EntidadClient } from "./EntidadClient";
import { getCuentas } from "@/lib/actions/asiento-actions";

export default async function EntidadesPage() {
  const [entidades, tipos, cuentas] = await Promise.all([
    getEntidades(['CLIENTE', 'PROVEEDOR']),
    getTiposEntidad(),
    getCuentas()
  ]);

  return (
    <div className="p-8">
      <EntidadClient initialEntidades={entidades} tipos={tipos} cuentas={cuentas} />
    </div>
  );
}
