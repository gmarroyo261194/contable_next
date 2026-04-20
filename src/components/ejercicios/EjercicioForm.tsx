"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Calendar, Lock, Unlock, Loader2, Hash, Database, CheckCircle2 } from "lucide-react";
import { createEjercicio, updateEjercicio, migrateAsientosLegacy } from "@/app/ejercicios/actions";

interface EjercicioFormProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EjercicioForm({ initialData, onClose, onSuccess }: EjercicioFormProps) {
  const [loading, setLoading] = React.useState(false);
  
  const formatDateForInput = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      numero: initialData.numero,
      inicio: formatDateForInput(initialData.inicio),
      fin: formatDateForInput(initialData.fin),
      cerrado: initialData.cerrado,
    } : {
      numero: new Date().getFullYear(),
      inicio: "",
      fin: "",
      cerrado: false,
    },
  });

  const onMigration = async () => {
    if (!initialData) return;
    if (!confirm(`¿Desea iniciar la migración de asientos desde la base de datos Fundacion para el año ${initialData.numero}? Solo se migrarán los asientos que no existan actualmente.`)) return;

    setLoading(true);
    try {
      const result = await migrateAsientosLegacy(initialData.id, initialData.numero);
      if (result.success) {
        alert(`Migración completada. Se migraron ${result.count} asientos.`);
        onSuccess();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message || "Error al migrar los asientos.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        numero: parseInt(data.numero),
        inicio: new Date(data.inicio + "T00:00:00Z"),
        fin: new Date(data.fin + "T00:00:00Z"),
        cerrado: data.cerrado === "true" || data.cerrado === true,
      };

      if (initialData) {
        await updateEjercicio(initialData.id, payload);
      } else {
        await createEjercicio(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al guardar el ejercicio.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Número de Ejercicio */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Número / Año del Ejercicio</label>
          <div className="relative group">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="number"
              {...register("numero", { required: true, min: 1 })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. 2026"
            />
          </div>
          {errors.numero && <span className="text-xs text-red-500 font-medium">Este campo es requerido y debe ser mayor a 0</span>}
        </div>

        {/* Fecha Inicio */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Fecha de Inicio</label>
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="date"
              {...register("inicio", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          {errors.inicio && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {/* Fecha Fin */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Fecha de Finalización</label>
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="date"
              {...register("fin", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            />
          </div>
          {errors.fin && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {initialData && (
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-700">Estado del Ejercicio</label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  {...register("cerrado")}
                  className="hidden peer"
                  defaultChecked={!initialData.cerrado}
                />
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-600 transition-all text-sm font-bold text-slate-500">
                  <Unlock className="size-4" />
                  Abierto
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  {...register("cerrado")}
                  className="hidden peer"
                  defaultChecked={initialData.cerrado}
                />
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-600 transition-all text-sm font-bold text-slate-500">
                  <Lock className="size-4" />
                  Cerrado
                </div>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {initialData && (
          <button
            type="button"
            onClick={onMigration}
            disabled={loading}
            className="mr-auto flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-amber-600 hover:bg-amber-50 border border-amber-200 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Migrar Asientos (Legacy)
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : initialData ? (
            "Guardar Cambios"
          ) : (
            "Abrir Ejercicio"
          )}
        </button>
      </div>
    </form>
  );
}
