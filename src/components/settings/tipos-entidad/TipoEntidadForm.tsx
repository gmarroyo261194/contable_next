"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Tag, Loader2 } from "lucide-react";
import { createTipoEntidad, updateTipoEntidad } from "@/app/settings/tipos-entidad/actions";

interface TipoEntidadFormProps {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function TipoEntidadForm({ initialData, onClose, onSuccess }: TipoEntidadFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      nombre: "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateTipoEntidad(initialData.id, data);
      } else {
        await createTipoEntidad(data);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al guardar el tipo de entidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">Nombre del Tipo</label>
        <div className="relative group">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            {...register("nombre", { required: true })}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
            placeholder="Ej. CLIENTE, PROVEEDOR, TRANSPORTISTA"
          />
        </div>
        {errors.nombre && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
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
            "Crear Tipo"
          )}
        </button>
      </div>
    </form>
  );
}
