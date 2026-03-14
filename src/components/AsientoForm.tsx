"use client";

import React from 'react';
import { 
  Trash2, 
  Plus, 
  CheckCircle2,
  X
} from 'lucide-react';

interface AsientoFormProps {
  onClose: () => void;
}

export function AsientoForm({ onClose }: AsientoFormProps) {
  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header Section */}
      <header className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-800 font-display">Nuevo Asiento Contable</h1>
          <p className="text-slate-500 text-xs">Crear un ajuste contable manual</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="btn-outline flex items-center gap-2 text-xs py-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Cancelar
          </button>
          <button className="btn-primary flex items-center gap-2 bg-primary text-xs py-1.5">
            Registrar Asiento
          </button>
        </div>
      </header>

      {/* Journal Form Card */}
      <div className="flex-1 overflow-y-auto">
        <section className="bg-white">
          {/* Form Top Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="entry_date">Fecha</label>
                <input 
                  className="w-full border-slate-200 rounded-custom text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden p-2" 
                  id="entry_date" 
                  type="date" 
                  defaultValue="2026-03-14"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="reference">Nº de Referencia</label>
                <input 
                  className="w-full border-slate-200 rounded-custom text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden p-2" 
                  id="reference" 
                  placeholder="JE-2026-001" 
                  type="text"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2" htmlFor="main_desc">Descripción General</label>
                <textarea 
                  className="w-full border-slate-200 rounded-custom text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-hidden p-2" 
                  id="main_desc" 
                  placeholder="Describa el propósito de este asiento..." 
                  rows={2}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-32 text-center">Código</th>
                  <th className="px-6 py-4">Cuenta</th>
                  <th className="px-6 py-4">Descripción</th>
                  <th className="px-6 py-4 w-40 text-right">Débito</th>
                  <th className="px-6 py-4 w-40 text-right">Crédito</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Line Item 1 */}
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm font-semibold text-slate-700 placeholder-slate-300 bg-transparent text-center" placeholder="0000" type="text" defaultValue="1100"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-slate-600 placeholder-slate-300 bg-transparent" placeholder="Buscar cuenta..." type="text" defaultValue="Caja y Equivalentes"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-slate-600 placeholder-slate-300 bg-transparent" placeholder="Nota..." type="text"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-bold placeholder-slate-300 bg-transparent" placeholder="0.00" type="number" defaultValue="1500.00"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-bold placeholder-slate-300 bg-transparent" placeholder="0.00" type="number"/>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
                {/* Line Item 2 */}
                <tr className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm font-semibold text-slate-700 placeholder-slate-300 bg-transparent text-center" placeholder="0000" type="text" defaultValue="4000"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-slate-600 placeholder-slate-300 bg-transparent" placeholder="Buscar cuenta..." type="text" defaultValue="Ingresos por Ventas"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-slate-600 placeholder-slate-300 bg-transparent" placeholder="Nota..." type="text"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-bold placeholder-slate-300 bg-transparent" placeholder="0.00" type="number"/>
                  </td>
                  <td className="px-6 py-4">
                    <input className="w-full border-none p-0 focus:ring-0 text-sm text-right text-slate-900 font-bold placeholder-slate-300 bg-transparent" placeholder="0.00" type="number" defaultValue="1500.00"/>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add Line Button */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
            <button className="flex items-center gap-2 text-primary hover:text-blue-900 text-xs font-bold uppercase tracking-wider transition-colors">
              <Plus className="w-4 h-4" />
              Añadir Línea
            </button>
            <div className="text-[10px] text-slate-400 font-medium">Use Tab o Enter para navegar rápidamente</div>
          </div>
        </section>
      </div>

      {/* Balance Section */}
      <footer className="bg-slate-100 p-6 border-t border-slate-200">
        <div className="flex flex-col gap-3 max-w-sm ml-auto">
          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
            <span>Total Débito</span>
            <span className="text-slate-900 font-bold">$ 1,500.00</span>
          </div>
          <div className="flex justify-between items-center text-sm font-medium text-slate-600">
            <span>Total Crédito</span>
            <span className="text-slate-900 font-bold">$ 1,500.00</span>
          </div>
          <div className="h-px bg-slate-200 my-1"></div>
          
          <div className="flex justify-between items-center py-2 px-3 bg-white border border-green-200 rounded-custom shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Cuadrado</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="text-base font-black text-green-700">$ 0.00</span>
               <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
