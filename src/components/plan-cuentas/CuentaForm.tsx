"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { Hash, Type, Tags, CheckSquare, Loader2, GitBranch } from "lucide-react";
import { createCuenta, updateCuenta } from "@/app/plan-cuentas/actions";

interface CuentaFormProps {
  initialData?: any;
  cuentas?: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CuentaForm({ initialData, cuentas, onClose, onSuccess }: CuentaFormProps) {
  const [loading, setLoading] = React.useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData ? {
      codigo: initialData.codigo,
      codigoCorto: initialData.codigoCorto,
      nombre: initialData.nombre,
      tipo: initialData.tipo,
      imputable: initialData.imputable,
      padreId: initialData.padreId,
    } : {
      codigo: "",
      codigoCorto: "",
      nombre: "",
      tipo: "ACTIVO",
      imputable: true,
      padreId: "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        codigoCorto: data.codigoCorto ? parseInt(data.codigoCorto) : null,
        padreId: data.padreId ? parseInt(data.padreId) : null,
        imputable: data.imputable === "true" || data.imputable === true,
      };

      if (initialData) {
        await updateCuenta(initialData.id, payload);
      } else {
        await createCuenta(payload);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || "Error al guardar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Código */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Código de Cuenta</label>
          <div className="relative group">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("codigo", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-mono"
              placeholder="Ej. 110101"
            />
          </div>
        </div>

        {/* Código Corto */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Código Alternativo</label>
          <div className="relative group">
            <Tags className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="number"
              {...register("codigoCorto")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Opcional"
            />
          </div>
        </div>

        {/* Nombre */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-bold text-slate-700">Nombre de la Cuenta</label>
          <div className="relative group">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              {...register("nombre", { required: true })}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              placeholder="Ej. Caja General"
            />
          </div>
        </div>

        {/* Tipo (Capitulo) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Capítulo / Tipo</label>
          <select
            {...register("tipo", { required: true })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          >
            <option value="ACTIVO">ACTIVO</option>
            <option value="PASIVO">PASIVO</option>
            <option value="RESULTADO">RESULTADO</option>
            <option value="PATRIMONIO_NETO">PATRIMONIO NETO</option>
            <option value="CUENTAS TRANSITORIAS">CUENTAS TRANSITORIAS</option>
          </select>
        </div>

        {/* Padre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Cuenta Padre</label>
          <div className="relative group">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <select
              {...register("padreId")}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm appearance-none"
            >
              <option value="">Ninguna (Nivel 1)</option>
              {cuentas?.filter(c => !c.imputable).map(c => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Imputable */}
        <div className="space-y-3 md:col-span-2">
          <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">¿Cómo operará esta cuenta?</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input type="radio" value="true" {...register("imputable")} className="hidden peer" />
              <div className="h-full flex flex-col items-center text-center p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm peer-checked:border-emerald-500 peer-checked:bg-emerald-50/50 transition-all hover:border-slate-200 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-3xl translate-x-4 -translate-y-4 peer-checked:translate-x-0 peer-checked:translate-y-0 transition-transform"></div>
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform peer-checked:bg-emerald-500 peer-checked:text-white">
                  <CheckSquare className="size-5 text-slate-400 peer-checked:text-white" />
                </div>
                <span className="text-sm font-black text-slate-700 peer-checked:text-emerald-800 uppercase tracking-tighter">Imputable</span>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight peer-checked:text-emerald-600/70 uppercase">Registra movimientos y asientos en el libro diario</p>
                
                {/* Visual indicator dot */}
                <div className="mt-3 size-2 rounded-full bg-slate-200 peer-checked:bg-emerald-500 animate-pulse"></div>
              </div>
            </label>

            <label className="cursor-pointer">
              <input type="radio" value="false" {...register("imputable")} className="hidden peer" />
              <div className="h-full flex flex-col items-center text-center p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm peer-checked:border-amber-500 peer-checked:bg-amber-50/50 transition-all hover:border-slate-200 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-3xl translate-x-4 -translate-y-4 peer-checked:translate-x-0 peer-checked:translate-y-0 transition-transform"></div>
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform peer-checked:bg-amber-500 peer-checked:text-white">
                  <GitBranch className="size-5 text-slate-400 peer-checked:text-white" />
                </div>
                <span className="text-sm font-black text-slate-700 peer-checked:text-amber-800 uppercase tracking-tighter">De Sumatoria</span>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-tight peer-checked:text-amber-600/70 uppercase">Agrupa otras subcuentas y muestra el saldo total</p>
                
                {/* Visual indicator dot */}
                <div className="mt-3 size-2 rounded-full bg-slate-200 peer-checked:bg-amber-500 animate-pulse"></div>
              </div>
            </label>
          </div>
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cuenta"}
        </button>
      </div>
    </form>
  );
}
