"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog } from '@/components/Dialog';
import { AccountSearchDialog } from '@/components/AccountSearchDialog';
import { upsertServicio } from '@/lib/actions/servicio-actions';
import { toast } from 'sonner';
import { Percent, Search, Landmark, Building2, Tag, Wrench } from 'lucide-react';

interface Account {
  id: number;
  nombre: string;
  codigo: string;
  codigoCorto: number | null;
}

interface ServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicio?: any | null;
  rubros: any[];
  departamentos: any[];
  cuentas: Account[];
  empresaId: number;
}

type AccountSelectorField = 
  | 'cuentaFundacionImputarId' 
  | 'cuentaFundacionRetenerId' 
  | 'cuentaDeptoImputarId' 
  | 'cuentaDeptoRetenerId';

export function ServicioModal({ 
  isOpen, 
  onClose, 
  servicio, 
  rubros, 
  departamentos, 
  cuentas, 
  empresaId 
}: ServicioModalProps) {
  const [activeAccountSelector, setActiveAccountSelector] = useState<{
    isOpen: boolean;
    field: AccountSelectorField | null;
  }>({ isOpen: false, field: null });

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '',
      activo: true,
      rubroId: '',
      departamentoId: '',
      participacionFundacion: false,
      porcentajeFundacion: 0,
      cuentaFundacionImputarId: null,
      cuentaFundacionRetenerId: null,
      participacionDepto: false,
      porcentajeDepto: 0,
      cuentaDeptoImputarId: null,
      cuentaDeptoRetenerId: null,
    }
  });

  const watchFundacion = watch('participacionFundacion');
  const watchDepto = watch('participacionDepto');
  
  // Watch for account selections to display names
  const watchFundImputar = watch('cuentaFundacionImputarId');
  const watchFundRetener = watch('cuentaFundacionRetenerId');
  const watchDeptoImputar = watch('cuentaDeptoImputarId');
  const watchDeptoRetener = watch('cuentaDeptoRetenerId');

  useEffect(() => {
    if (servicio) {
      const config = servicio.configs?.[0] || {};
      reset({
        nombre: servicio.nombre,
        activo: servicio.activo,
        rubroId: servicio.rubroId.toString(),
        departamentoId: servicio.departamentoId?.toString() || '',
        participacionFundacion: servicio.participacionFundacion,
        porcentajeFundacion: Number(servicio.porcentajeFundacion || 0),
        cuentaFundacionImputarId: config.cuentaFundacionImputarId,
        cuentaFundacionRetenerId: config.cuentaFundacionRetenerId,
        participacionDepto: servicio.participacionDepto,
        porcentajeDepto: Number(servicio.porcentajeDepto || 0),
        cuentaDeptoImputarId: config.cuentaDeptoImputarId,
        cuentaDeptoRetenerId: config.cuentaDeptoRetenerId,
      });
    } else {
      reset({
        nombre: '',
        activo: true,
        rubroId: '',
        departamentoId: '',
        participacionFundacion: false,
        porcentajeFundacion: 0,
        cuentaFundacionImputarId: null,
        cuentaFundacionRetenerId: null,
        participacionDepto: false,
        porcentajeDepto: 0,
        cuentaDeptoImputarId: null,
        cuentaDeptoRetenerId: null,
      });
    }
  }, [servicio, reset]);

  const onSubmit = async (data: any) => {
    try {
      await upsertServicio({
        id: servicio?.id,
        nombre: data.nombre,
        activo: data.activo,
        rubroId: parseInt(data.rubroId),
        departamentoId: data.departamentoId ? parseInt(data.departamentoId) : null,
        participacionFundacion: data.participacionFundacion,
        porcentajeFundacion: data.participacionFundacion ? parseFloat(data.porcentajeFundacion) : null,
        participacionDepto: data.participacionDepto,
        porcentajeDepto: data.participacionDepto ? parseFloat(data.porcentajeDepto) : null,
        empresaId,
        config: {
          cuentaFundacionImputarId: data.participacionFundacion ? data.cuentaFundacionImputarId : null,
          cuentaFundacionRetenerId: data.participacionFundacion ? data.cuentaFundacionRetenerId : null,
          cuentaDeptoImputarId: data.participacionDepto ? data.cuentaDeptoImputarId : null,
          cuentaDeptoRetenerId: data.participacionDepto ? data.cuentaDeptoRetenerId : null,
        }
      });
      toast.success(servicio ? 'Servicio actualizado' : 'Servicio creado');
      onClose();
    } catch (error) {
      toast.error('Error al guardar el servicio. Verifique que el nombre sea único.');
    }
  };

  const getAccountName = (id: number | null) => {
    if (!id) return "Seleccionar cuenta...";
    const account = cuentas.find(c => c.id === id);
    return account ? `${account.codigo} - ${account.nombre}` : "Cuenta no encontrada";
  };

  const openAccountSelector = (field: AccountSelectorField) => {
    setActiveAccountSelector({ isOpen: true, field });
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-[550px] max-w-full">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-3 h-3" /> Nombre del Servicio
            </label>
            <input
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden transition-all shadow-xs"
              placeholder="Ej: Mantenimiento Preventivo"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Rubro
            </label>
            <select
              {...register('rubroId', { required: 'Debe seleccionar un rubro' })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-hidden transition-all"
            >
              <option value="">Seleccionar...</option>
              {rubros.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Departamento
            </label>
            <select
              {...register('departamentoId')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-hidden transition-all"
            >
              <option value="">Ninguno</option>
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Participación Fundación */}
        <div className={`p-4 rounded-2xl border transition-all ${watchFundacion ? 'bg-green-50/30 border-green-100 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <input
              {...register('participacionFundacion')}
              type="checkbox"
              className="size-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Participación Fundación</span>
              <span className="text-[10px] text-slate-500">¿Se aplica retención para la Fundación?</span>
            </div>
          </div>

          {watchFundacion && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Porcentaje Fundación</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    {...register('porcentajeFundacion', { min: 0, max: 100 })}
                    className="w-full bg-white border border-green-100 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-hidden"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-green-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cuenta a Imputar</label>
                  <button
                    type="button"
                    onClick={() => openAccountSelector('cuentaFundacionImputarId')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-green-100 rounded-xl text-xs text-slate-600 hover:bg-green-50 transition-colors"
                  >
                    <span className="truncate">{getAccountName(watchFundImputar)}</span>
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cuenta a Retener</label>
                  <button
                    type="button"
                    onClick={() => openAccountSelector('cuentaFundacionRetenerId')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-green-100 rounded-xl text-xs text-slate-600 hover:bg-green-50 transition-colors"
                  >
                    <span className="truncate">{getAccountName(watchFundRetener)}</span>
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participación Departamento */}
        <div className={`p-4 rounded-2xl border transition-all ${watchDepto ? 'bg-blue-50/30 border-blue-100 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <input
              {...register('participacionDepto')}
              type="checkbox"
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Participación Departamento</span>
              <span className="text-[10px] text-slate-500">¿Se aplica retención para el Departamento?</span>
            </div>
          </div>

          {watchDepto && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">Porcentaje Departamento</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    {...register('porcentajeDepto', { min: 0, max: 100 })}
                    className="w-full bg-white border border-blue-100 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <Percent className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cuenta a Imputar</label>
                  <button
                    type="button"
                    onClick={() => openAccountSelector('cuentaDeptoImputarId')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-blue-100 rounded-xl text-xs text-slate-600 hover:bg-blue-50 transition-colors"
                  >
                    <span className="truncate">{getAccountName(watchDeptoImputar)}</span>
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Cuenta a Retener</label>
                  <button
                    type="button"
                    onClick={() => openAccountSelector('cuentaDeptoRetenerId')}
                    className="w-full flex items-center justify-between px-3 py-2 bg-white border border-blue-100 rounded-xl text-xs text-slate-600 hover:bg-blue-50 transition-colors"
                  >
                    <span className="truncate">{getAccountName(watchDeptoRetener)}</span>
                    <Search className="size-3.5 text-slate-400 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : servicio ? 'Guardar Cambios' : 'Crear Servicio'}
          </button>
        </div>
      </form>

      <AccountSearchDialog
        isOpen={activeAccountSelector.isOpen}
        onClose={() => setActiveAccountSelector({ isOpen: false, field: null })}
        onSelect={(account) => {
          if (activeAccountSelector.field) {
            setValue(activeAccountSelector.field, account.id as any);
          }
        }}
        cuentas={cuentas}
      />
    </Dialog>
  );
}
