"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Coins, Tag, Type, Loader2 } from "lucide-react";
import { createMoneda, updateMoneda } from "@/app/settings/monedas/actions";

interface MonedaFormProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function MonedaForm({ initialData, onClose, onSuccess }: MonedaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      codigo: "",
      nombre: "",
      simbolo: "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateMoneda(initialData.id, data);
      } else {
        await createMoneda(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving moneda:", error);
      alert("Error al guardar la moneda. Verifique que el código no esté duplicado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Código */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Código (ISO)</label>
          <div className="relative group">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("codigo", { required: true, maxLength: 10 })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. ARS, USD"
            />
          </div>
          {errors.codigo && <span className="text-xs text-red-500 font-medium">Este campo es requerido (máx 10 car)</span>}
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la Moneda</label>
          <div className="relative group">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("nombre", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. Pesos Argentinos"
            />
          </div>
          {errors.nombre && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {/* Símbolo */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Símbolo</label>
          <div className="relative group">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("simbolo", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. $, u$s"
            />
          </div>
          {errors.simbolo && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
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
            "Crear Moneda"
          )}
        </button>
      </div>
    </form>
  );
}
