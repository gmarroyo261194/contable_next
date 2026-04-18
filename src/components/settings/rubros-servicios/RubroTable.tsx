"use client";

import React, { useState } from 'react';
import { Edit2, ToggleLeft, ToggleRight, Plus, Tag } from 'lucide-react';
import { Rubro } from '@prisma/client';
import { toggleRubro } from '@/lib/actions/rubro-actions';
import { toast } from 'sonner';

interface RubroTableProps {
  rubros: Rubro[];
  onEdit: (rubro: Rubro) => void;
  onAdd: () => void;
}

export function RubroTable({ rubros, onEdit, onAdd }: RubroTableProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setLoading(id);
    try {
      await toggleRubro(id, !currentStatus);
      toast.success(`Rubro ${!currentStatus ? 'activado' : 'inhabilitado'} correctamente`);
    } catch (error) {
      toast.error("Error al cambiar el estado del rubro");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-slate-800 text-sm">Listado de Rubros</h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-3.5" />
          Nuevo Rubro
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 uppercase tracking-wider text-[10px] font-black text-slate-400 bg-slate-50/30">
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rubros.length > 0 ? (
              rubros.map((rubro) => (
                <tr key={rubro.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{rubro.nombre}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                      rubro.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {rubro.activo ? 'Activo' : 'Inhabilitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(rubro)}
                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(rubro.id, rubro.activo)}
                        disabled={loading === rubro.id}
                        className={`p-1.5 transition-all rounded-lg ${
                          rubro.activo ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'
                        }`}
                        title={rubro.activo ? 'Inhabilitar' : 'Activar'}
                      >
                        {rubro.activo ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No hay rubros definidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
