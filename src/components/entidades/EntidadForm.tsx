"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { User, Hash, Tag, Loader2, ChevronDown, Mail, Phone, CreditCard } from "lucide-react";
import { createEntidad, updateEntidad } from "@/app/entidades/actions";

interface EntidadFormProps {
  initialData?: any;
  tipos: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EntidadForm({ initialData, tipos, onClose, onSuccess }: EntidadFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      nombre: initialData.nombre || "",
      cuit: initialData.cuit || "",
      nroDoc: initialData.nroDoc || "",
      email: initialData.email || "",
      telefono: initialData.telefono || "",
      tipoId: initialData.tipoId,
    } : {
      nombre: "",
      cuit: "",
      nroDoc: "",
      email: "",
      telefono: "",
      tipoId: tipos.length > 0 ? tipos[0].id : "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        tipoId: parseInt(data.tipoId),
        cuit: data.cuit || null,
        nroDoc: data.nroDoc || null,
        email: data.email || null,
        telefono: data.telefono || null,
      };
      if (initialData) {
        await updateEntidad(initialData.id, payload);
      } else {
        await createEntidad(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving entidad:", error);
      alert(error.message || "Error al guardar la entidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre / Razón Social</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("nombre", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. Juan Pérez o Empresa S.A."
            />
          </div>
          {errors.nombre && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>

        {/* CUIT */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">CUIT / CUIL</label>
          <div className="relative group">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("cuit")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. 20-12345678-9 (Opcional)"
            />
          </div>
        </div>

        {/* DNI */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">DNI / Nro. Documento</label>
          <div className="relative group">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("nroDoc")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. 12345678"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              {...register("email")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="correo@ejemplo.com"
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
              placeholder="Ej. +54 9..."
            />
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Tipo de Entidad</label>
          <div className="relative group">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <select
              {...register("tipoId", { required: true })}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="">Seleccione un tipo...</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors" />
          </div>
          {errors.tipoId && <span className="text-xs text-red-500 font-medium">Este campo es requerido</span>}
        </div>
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
            "Crear Entidad"
          )}
        </button>
      </div>
    </form>
  );
}
