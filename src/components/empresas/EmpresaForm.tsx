"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Building2, Hash, MapPin, Phone, Mail, Coins, Loader2 } from "lucide-react";
import { createEmpresa, updateEmpresa } from "@/app/empresas/actions";

interface EmpresaFormProps {
  initialData?: any;
  monedas: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EmpresaForm({ initialData, monedas, onClose, onSuccess }: EmpresaFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      nombre: "",
      cuit: "",
      direccion: "",
      telefono: "",
      email: "",
      monedaId: monedas[0]?.id || "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateEmpresa(initialData.id, {
          ...data,
          monedaId: parseInt(data.monedaId),
        });
      } else {
        await createEmpresa({
          ...data,
          monedaId: parseInt(data.monedaId),
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving empresa:", error);
      alert("Error al guardar la empresa. Verifique los datos (el CUIT debe ser único).");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la Empresa</label>
          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("nombre", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. Mi Empresa S.A."
            />
          </div>
          {errors.nombre && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {/* CUIT */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">CUIT</label>
          <div className="relative group">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("cuit", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. 20-12345678-9"
            />
          </div>
          {errors.cuit && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {/* Dirección */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Dirección</label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("direccion")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Calle 123, Ciudad"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Teléfono</label>
          <div className="relative group">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("telefono")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="+54 11 1234-5678"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Email de Contacto</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("email")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="contacto@empresa.com"
              type="email"
            />
          </div>
        </div>

        {/* Moneda */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Moneda por Defecto</label>
          <div className="relative group">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <select
              {...register("monedaId", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm appearance-none"
            >
              {monedas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.simbolo})
                </option>
              ))}
            </select>
          </div>
          {errors.monedaId && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
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
            "Crear Empresa"
          )}
        </button>
      </div>
    </form>
  );
}
