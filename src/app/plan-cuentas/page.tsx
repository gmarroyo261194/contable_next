import React from "react";
import { getCuentas } from "./actions";
import { PlanCuentasClient } from "./PlanCuentasClient";

export default async function PlanCuentasPage() {
  const cuentas = await getCuentas();

  return (
    <div className="p-8">
      <PlanCuentasClient initialCuentas={cuentas} />
    </div>
  );
}
