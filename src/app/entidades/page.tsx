import React from "react";
import { getEntidades, getTiposEntidad } from "./actions";
import { EntidadClient } from "./EntidadClient";

export default async function EntidadesPage() {
  const [entidades, tipos] = await Promise.all([
    getEntidades(),
    getTiposEntidad()
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <EntidadClient initialEntidades={entidades} tipos={tipos} />
    </div>
  );
}
