"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@/components/Dialog';
import { upsertDepartamento } from '@/lib/actions/departamento-actions';
import { Departamento } from '@prisma/client';
import { toast } from 'sonner';

interface DeptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  departamento?: Departamento | null;
}

export function DeptoModal({ isOpen, onClose, departamento }: DeptoModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      nombre: '',
      activo: true
    }
  });

  useEffect(() => {
    if (departamento) {
      reset({
        nombre: departamento.nombre,
        activo: departamento.activo
      });
    } else {
      reset({
        nombre: '',
        activo: true
      });
    }
  }, [departamento, reset]);

  const onSubmit = async (data: any) => {
    try {
      await upsertDepartamento({
        id: departamento?.id,
        nombre: data.nombre,
        activo: data.activo
      });
      toast.success(departamento ? 'Departamento actualizado' : 'Departamento creado');
      onClose();
    } catch (error) {
      toast.error('Error al guardar el departamento. Verifique que el nombre sea único.');
    }
  };

  return (
    <Dialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title={departamento ? 'Editar Departamento' : 'Nuevo Departamento'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-[400px] max-w-full">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            Nombre del Departamento
          </label>
          <input
            {...register('nombre', { required: 'El nombre es obligatorio' })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden transition-all shadow-xs"
            placeholder="Ej: Departamento de Sistemas, Finanzas, etc."
          />
          {errors.nombre && (
            <span className="text-red-500 text-[10px] font-bold uppercase">{errors.nombre.message}</span>
          )}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <input
            {...register('activo')}
            type="checkbox"
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-700">Departamento Activo</span>
            <span className="text-[10px] text-slate-500">Determina si este departamento puede asignarse a nuevos servicios</span>
          </div>
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
            {isSubmitting ? 'Guardando...' : departamento ? 'Guardar Cambios' : 'Crear Departamento'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
