"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { User, Mail, Shield, Lock, Loader2 } from "lucide-react";
import { createUser, updateUser } from "@/app/settings/security/actions";

interface UserFormProps {
  initialData?: any;
  availableRoles: any[];
  availableEmpresas: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ initialData, availableRoles, availableEmpresas, onClose, onSuccess }: UserFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      name: initialData.name || "",
      email: initialData.email || "",
      roleIds: initialData.roles?.map((r: any) => r.roleId) || [],
      empresaIds: initialData.empresas?.map((e: any) => e.empresaId) || [],
    } : {
      name: "",
      email: "",
      password: "",
      roleIds: [],
      empresaIds: [],
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const formattedData = {
      ...data,
      empresaIds: data.empresaIds?.map((id: string) => parseInt(id)) || [],
    };
    
    try {
      if (initialData) {
        await updateUser(initialData.id, formattedData);
      } else {
        await createUser(formattedData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error al guardar el usuario.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("name", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Nombre del usuario"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("email", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="usuario@ejemplo.com"
              type="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Contraseña {initialData && "(dejar en blanco para no cambiar)"}</label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("password", { required: !initialData })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="••••••••"
              type="password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Roles</label>
          <div className="grid grid-cols-1 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] max-h-32 overflow-y-auto">
            {availableRoles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-primary transition-colors">
                <input
                  type="checkbox"
                  value={role.id}
                  {...register("roleIds")}
                  className="rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                {role.name}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Empresas Asignadas</label>
          <div className="grid grid-cols-1 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px] max-h-32 overflow-y-auto">
            {availableEmpresas.map((emp) => (
              <label key={emp.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer hover:text-primary transition-colors">
                <input
                  type="checkbox"
                  value={emp.id.toString()}
                  {...register("empresaIds")}
                  className="rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                {emp.nombre}
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? "Guardar" : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
}
