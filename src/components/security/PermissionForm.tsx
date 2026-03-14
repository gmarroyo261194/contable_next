"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Key, FileText, Loader2 } from "lucide-react";
import { createPermission, updatePermission } from "@/app/settings/security/actions";

export function PermissionForm({ initialData, onClose, onSuccess }: any) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: initialData || {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updatePermission(initialData.id, data);
      } else {
        await createPermission(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert("Error al guardar el permiso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre del Permiso</label>
          <div className="relative group">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("name", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. asientos:create, reportes:view"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Descripción</label>
          <div className="relative group">
            <FileText className="absolute left-3 top-3 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <textarea
              {...register("description")}
              rows={3}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Describa para qué sirve este permiso..."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button disabled={loading} className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? "Guardar" : "Crear Permiso"}
        </button>
      </div>
    </form>
  );
}
