"use client";

import React, { useState } from 'react';
import { Edit2, ToggleLeft, ToggleRight, Plus, Wrench, Percent, Home, Building } from 'lucide-react';
import { toggleServicio } from '@/lib/actions/servicio-actions';
import { toast } from 'sonner';

interface ServicioTableProps {
  servicios: any[];
  onEdit: (servicio: any) => void;
  onAdd: () => void;
}

export function ServicioTable({ servicios, onEdit, onAdd }: ServicioTableProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setLoading(id);
    try {
      await toggleServicio(id, !currentStatus);
      toast.success(`Servicio ${!currentStatus ? 'activado' : 'inhabilitado'} correctamente`);
    } catch (error) {
      toast.error("Error al cambiar el estado del servicio");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-slate-800 text-sm">Listado de Servicios</h3>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="size-3.5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 uppercase tracking-wider text-[10px] font-black text-slate-400 bg-slate-50/30">
              <th className="px-6 py-4">Servicio</th>
              <th className="px-6 py-4">Rubro / Depto</th>
              <th className="px-6 py-4 text-center">Ret. Fund.</th>
              <th className="px-6 py-4 text-center">Ret. Depto.</th>
              <th className="px-6 py-4">Cuentas Configuradas</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {servicios.length > 0 ? (
              servicios.map((servicio) => {
                const config = servicio.configs?.[0];
                const hasFullConfig = config && 
                  config.cuentaFundacionImputarId && 
                  config.cuentaFundacionRetenerId && 
                  config.cuentaDeptoImputarId && 
                  config.cuentaDeptoRetenerId;

                return (
                  <tr key={servicio.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{servicio.nombre}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">#{servicio.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <Home className="w-3 h-3" /> {servicio.rubro?.nombre || 'Sin rubro'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Building className="w-3 h-3" /> {servicio.departamento?.nombre || 'Sin depto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {servicio.participacionFundacion ? (
                        <div className="flex flex-col items-center">
                          <span className="text-green-600 font-black text-xs">{Number(servicio.porcentajeFundacion)}%</span>
                          {config?.cuentaFundacionImputar ? (
                            <span className="text-[9px] text-slate-400 truncate max-w-[100px]" title={config.cuentaFundacionImputar.nombre}>
                              {config.cuentaFundacionImputar.codigo}
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold uppercase">Sin Cuenta</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {servicio.participacionDepto ? (
                        <div className="flex flex-col items-center">
                          <span className="text-blue-600 font-black text-xs">{Number(servicio.porcentajeDepto)}%</span>
                          {config?.cuentaDeptoImputar ? (
                            <span className="text-[9px] text-slate-400 truncate max-w-[100px]" title={config.cuentaDeptoImputar.nombre}>
                              {config.cuentaDeptoImputar.codigo}
                            </span>
                          ) : (
                            <span className="text-[9px] text-red-400 font-bold uppercase">Sin Cuenta</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        hasFullConfig ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {hasFullConfig ? 'OK' : 'Incompleto'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
                        servicio.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {servicio.activo ? 'Activo' : 'Baja'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(servicio)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 className="size-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(servicio.id, servicio.activo)}
                          disabled={loading === servicio.id}
                          className={`p-1.5 transition-all rounded-lg ${
                            servicio.activo ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'
                          }`}
                          title={servicio.activo ? 'Inhabilitar' : 'Activar'}
                        >
                          {servicio.activo ? <ToggleRight className="size-5" /> : <ToggleLeft className="size-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  No hay servicios definidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
