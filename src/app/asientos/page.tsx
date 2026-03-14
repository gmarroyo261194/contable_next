"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Bell, 
  HelpCircle,
  FileSpreadsheet,
  FileText,
  Calendar,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';

const asientosData = [
  {
    id: 'ASC-001024',
    fecha: '15/10/2023',
    referencia: 'FAC-2023-99',
    concepto: 'Pago de proveedores - Servicios IT',
    debito: 1250.00,
    credito: 1250.00,
    estado: 'Cuadrado'
  },
  {
    id: 'ASC-001023',
    fecha: '14/10/2023',
    referencia: 'BOL-554',
    concepto: 'Venta de mercaderías contado',
    debito: 450.00,
    credito: 450.00,
    estado: 'Cuadrado'
  },
  {
    id: 'ASC-001022',
    fecha: '14/10/2023',
    referencia: 'MEMO-01',
    concepto: 'Ajuste de inventario (Borrador)',
    debito: 2000.00,
    credito: 1850.00,
    estado: 'Descuadrado'
  },
  {
    id: 'ASC-001021',
    fecha: '13/10/2023',
    referencia: 'FAC-982',
    concepto: 'Compra de insumos de oficina',
    debito: 120.00,
    credito: 120.00,
    estado: 'Cuadrado'
  }
];

export default function AsientosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Listado de Asientos Contables</h2>
          <p className="text-slate-500 mt-1 font-medium">Gestione y visualice todos los movimientos contables del periodo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Exportar Excel
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <FileText className="w-4 h-4 text-red-500" />
            Exportar PDF
          </button>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Asiento
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-600">Rango:</span>
        </div>
        <div className="flex items-center gap-2">
          <input className="bg-slate-50 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-primary focus:border-primary outline-hidden" type="date" />
          <span className="text-slate-400 font-bold">al</span>
          <input className="bg-slate-50 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-primary focus:border-primary outline-hidden" type="date" />
        </div>
        <div className="h-6 w-px bg-slate-200 mx-2"></div>
        <select className="bg-slate-50 border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:ring-primary focus:border-primary outline-hidden min-w-[150px] font-medium text-slate-600">
          <option value="">Todos los estados</option>
          <option value="cuadrado">Cuadrado</option>
          <option value="descuadrado">Descuadrado</option>
        </select>
        <button className="text-primary text-sm font-black hover:underline ml-auto px-4">Limpiar Filtros</button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Asiento #</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Referencia</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Concepto</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Débito</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Crédito</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asientosData.map((asiento) => (
                <tr key={asiento.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{asiento.fecha}</td>
                  <td className="px-6 py-4 text-sm font-black text-primary">{asiento.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{asiento.referencia}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{asiento.concepto}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">$ {asiento.debito.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-slate-900">$ {asiento.credito.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                      asiento.estado === 'Cuadrado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      <span className={`size-1.5 rounded-full ${asiento.estado === 'Cuadrado' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      {asiento.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mostrando <span className="text-slate-900">1-4</span> de <span className="text-slate-900">248</span> asientos</p>
          <div className="flex gap-2">
            <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="size-8 bg-primary text-white rounded-lg font-black text-xs shadow-md shadow-primary/20">1</button>
            <button className="size-8 border border-slate-200 rounded-lg font-black text-xs hover:bg-white text-slate-600">2</button>
            <button className="size-8 border border-slate-200 rounded-lg font-black text-xs hover:bg-white text-slate-600">3</button>
            <button className="p-1.5 border border-slate-200 rounded-lg hover:bg-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Asiento Form Dialog */}
      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <AsientoForm onClose={() => setIsDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
