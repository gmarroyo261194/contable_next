import React from "react";
import { getFacturasDocentes } from "@/lib/actions/factura-docente-actions";
import { FacturaDocenteClient } from "./FacturaDocenteClient";

export default async function FacturasDocentesPage() {
  const facturas = await getFacturasDocentes();

  return (
    <div className="p-8">
      <FacturaDocenteClient initialData={facturas} />
    </div>
  );
}
