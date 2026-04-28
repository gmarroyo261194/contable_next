"use server";

import React from "react";
import { getModulos, toggleModulo } from "@/lib/actions/module-actions";
import { Database, ShieldCheck, ShieldAlert, Check, X } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ModulosPage() {
  const modulos = await getModulos();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-display">
          Gestión de Módulos
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Activa o desactiva funcionalidades core del sistema. 
          Al desactivar un módulo, las operaciones relacionadas serán bloqueadas y ocultadas del menú.
        </p>
      </header>

      <div className="grid gap-4">
        {modulos.map((modulo) => (
          <ModuloCard key={modulo.id} modulo={modulo} />
        ))}

        {modulos.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500">No hay módulos configurados.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuloCard({ modulo }: { modulo: any }) {
  async function handleToggle() {
    "use server";
    await toggleModulo(modulo.id, !modulo.activo);
    revalidatePath("/settings/modulos");
  }

  return (
    <div className={`group bg-white dark:bg-slate-900 border ${modulo.activo ? 'border-slate-200 dark:border-slate-800 shadow-sm' : 'border-slate-100 dark:border-slate-800 opacity-75'} rounded-2xl p-6 transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-xl flex items-center justify-center ${modulo.activo ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <Database className="size-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {modulo.nombre}
              {modulo.activo ? (
                <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Activo</span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Inactivo</span>
              )}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              {modulo.descripcion}
            </p>
          </div>
        </div>

        <form action={handleToggle}>
          <button
            type="submit"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              modulo.activo ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                modulo.activo ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </form>
      </div>
      
      {modulo.codigo === 'CONTABILIDAD' && !modulo.activo && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
          <ShieldAlert className="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            <strong>Restricciones activas:</strong> No se pueden generar asientos contables ni acceder al plan de cuentas. Las empresas y ejercicios permanecerán accesibles.
          </p>
        </div>
      )}
    </div>
  );
}
