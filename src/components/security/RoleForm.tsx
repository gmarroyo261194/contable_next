"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Shield, FileText, Loader2 } from "lucide-react";
import { createRole, updateRole } from "@/app/settings/security/actions";

export function RoleForm({ initialData, availablePermissions, onClose, onSuccess }: any) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: initialData ? {
      name: initialData.name || "",
      description: initialData.description || "",
      permissionIds: initialData.permissions?.map((p: any) => p.permissionId) || [],
    } : {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateRole(initialData.id, data);
      } else {
        await createRole(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert("Error al guardar el rol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre del Rol</label>
          <div className="relative group">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("name", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. Administrador, Contador"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Descripción</label>
          <div className="relative group">
            <FileText className="absolute left-3 top-3 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <textarea
              {...register("description")}
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Describa el alcance de este rol..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Permisos</label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl max-h-60 overflow-y-auto">
            {availablePermissions.map((perm: any) => (
              <label key={perm.id} className="flex items-start gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-primary transition-colors group">
                <input
                  type="checkbox"
                  value={perm.id}
                  {...register("permissionIds")}
                  className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <span className="flex flex-col">
                  <span>{perm.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal group-hover:text-slate-500">{perm.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors">
          Cancelar
        </button>
        <button disabled={loading} className="flex items-center gap-2 bg-primary px-8 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? "Guardar" : "Crear Rol"}
        </button>
      </div>
    </form>
  );
}
