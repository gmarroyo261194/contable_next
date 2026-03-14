import React from "react";
import { getMonedas } from "./actions";
import { MonedaClient } from "./MonedaClient";

export default async function MonedasPage() {
  const monedas = await getMonedas();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <MonedaClient initialMonedas={monedas} />
    </div>
  );
}
