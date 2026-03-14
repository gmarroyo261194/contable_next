import React from "react";
import { getTiposEntidad } from "./actions";
import { TipoEntidadClient } from "./TipoEntidadClient";

export default async function TiposEntidadPage() {
  const tipos = await getTiposEntidad();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <TipoEntidadClient initialTipos={tipos} />
    </div>
  );
}
