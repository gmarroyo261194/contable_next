import React from "react";
import { getEmpresas, getMonedas } from "./actions";
import { EmpresaClient } from "./EmpresaClient";

export default async function EmpresasPage() {
  const [empresas, monedas] = await Promise.all([
    getEmpresas(),
    getMonedas(),
  ]);

  return (
    <div className="p-8">
      <EmpresaClient 
        initialEmpresas={empresas} 
        monedas={monedas} 
      />
    </div>
  );
}
