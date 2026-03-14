"use client";

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Send
} from 'lucide-react';
import { SummaryCard } from '@/components/SummaryCard';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const [isAsientoDialogOpen, setIsAsientoDialogOpen] = React.useState(false);
  const { data: session } = useSession();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Resumen Financiero</h2>
          <p className="text-slate-500 text-sm">Información contable en tiempo real para Marzo 2026</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            <Upload className="w-4 h-4 text-slate-400" />
            Subir Documento
          </button>
          <button
            onClick={() => setIsAsientoDialogOpen(true)}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
          >
            <Plus className="w-4 h-4" />
            Nueva Entrada
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Ingresos Totales"
          value="$124,500.00"
          change="12.5%"
          isPositive={true}
          icon={TrendingUp}
          iconColor="text-primary-light"
          bgColor="bg-blue-50"
        />
        <SummaryCard
          title="Gastos Totales"
          value="$42,320.00"
          change="4.2%"
          isPositive={false}
          icon={TrendingDown}
          iconColor="text-red-600"
          bgColor="bg-red-50"
        />
        <SummaryCard
          title="Utilidad Neta"
          value="$82,180.00"
          change="18.3%"
          isPositive={true}
          icon={Wallet}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card h-80 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800">Cuentas por Cobrar vs Pagar</h3>
              <div className="flex gap-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center"><span className="w-2.5 h-2.5 bg-primary rounded-full mr-1.5"></span> Por Cobrar</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-300 rounded-full mr-1.5"></span> Por Pagar</div>
              </div>
            </div>
            {/* Mock Chart Area */}
            <div className="flex-1 flex items-end justify-between gap-4 pt-4 border-b border-slate-100 pb-1">
              {[
                { label: 'Ene', val1: '45%', val2: '30%' },
                { label: 'Feb', val1: '60%', val2: '25%' },
                { label: 'Mar', val1: '75%', val2: '40%' },
                { label: 'Abr', val1: '55%', val2: '35%' },
                { label: 'May', val1: '85%', val2: '50%' },
                { label: 'Jun', val1: '70%', val2: '38%' },
              ].map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex justify-center gap-1.5">
                    <div className="w-5 bg-primary rounded-t-custom transition-all duration-500" style={{ height: m.val1 }}></div>
                    <div className="w-5 bg-blue-300 rounded-t-custom transition-all duration-500" style={{ height: m.val2 }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Facturas Pendientes</h3>
              <button className="text-xs text-primary font-bold hover:underline">Ver Todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID Factura</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {[
                    { id: '#INV-2026-001', name: 'Acme Corp', amount: '$3,400.00', status: 'PENDIENTE', color: 'text-yellow-700 bg-yellow-100' },
                    { id: '#INV-2026-004', name: 'Stark Industries', amount: '$8,120.00', status: 'VENCIDO', color: 'text-red-700 bg-red-100' },
                    { id: '#INV-2026-009', name: 'Wayne Ent.', amount: '$1,250.00', status: 'PENDIENTE', color: 'text-yellow-700 bg-yellow-100' },
                  ].map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">{inv.id}</td>
                      <td className="px-6 py-4 text-slate-900">{inv.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800">{inv.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[9px] font-black rounded-full ${inv.color}`}>{inv.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:text-primary-light transition-colors"><Send className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Status Column */}
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800">Transacciones</h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-5">
              {[
                { name: 'Amazon Web Services', type: 'Suscripción', amount: '-$240.00', plus: false },
                { name: 'Global Tech Solutions', type: 'Consultoría', amount: '+$12,000.00', plus: true },
                { name: 'Office Realty Group', type: 'Alquiler', amount: '-$4,500.00', plus: false },
                { name: 'Starbucks Coffee', type: 'Viajes', amount: '-$12.45', plus: false },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-custom flex items-center justify-center text-slate-500 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      {tx.plus ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{tx.name}</p>
                      <p className="text-[10px] text-slate-500">{tx.type}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-black ${tx.plus ? 'text-green-600' : 'text-red-500'}`}>{tx.amount}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-primary bg-white border border-slate-200 rounded-custom hover:border-primary transition-all">
              Descargar Estado
            </button>
          </div>

          <div className="card bg-primary text-white border-none shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-8 -mt-8 rounded-full"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-sm mb-1 text-blue-100 font-display">Estado de Cuenta</h4>
              <p className="text-2xl font-black mb-4">$284,920.00</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-white/10 w-fit px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +8.4% este mes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asiento Form Dialog */}
      <Dialog isOpen={isAsientoDialogOpen} onClose={() => setIsAsientoDialogOpen(false)}>
        <AsientoForm onClose={() => setIsAsientoDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
