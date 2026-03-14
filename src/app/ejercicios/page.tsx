import React from "react";
import { getEjercicios } from "./actions";
import { EjercicioClient } from "./EjercicioClient";

export default async function EjerciciosPage() {
  const ejercicios = await getEjercicios();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <EjercicioClient initialEjercicios={ejercicios} />
    </div>
  );
}
