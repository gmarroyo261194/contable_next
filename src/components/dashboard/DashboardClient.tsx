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

/**
 * Componente cliente para el dashboard principal.
 * Muestra resúmenes, gráficos y transacciones recientes.
 * 
 * @returns {JSX.Element} Vista principal del dashboard.
 */
export default function DashboardClient() {
  const [isAsientoDialogOpen, setIsAsientoDialogOpen] = React.useState(false);
  const { data: session } = useSession();

  return (
    <div className="p-8 animate-in fade-in duration-500">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display italic">
            Hola, {session?.user?.name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground text-sm font-sans">
            Panel de control - { (session?.user as any)?.empresaNombre || 'Sin empresa seleccionada' }
            { (session?.user as any)?.ejercicioNombre && ` (Ejercicio ${(session?.user as any)?.ejercicioNombre})` }
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-card border border-border px-4 py-2.5 rounded-xl font-bold text-sm text-foreground hover:bg-muted transition-colors shadow-sm font-sans">
            <Upload className="w-4 h-4 text-muted-foreground" />
            Subir Documento
          </button>
          <button
            onClick={() => setIsAsientoDialogOpen(true)}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all font-display"
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
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500"
        />
        <SummaryCard
          title="Gastos Totales"
          value="$42,320.00"
          change="4.2%"
          isPositive={false}
          icon={TrendingDown}
          iconColor="text-red-600 dark:text-red-400"
          bgColor="bg-red-500"
        />
        <SummaryCard
          title="Utilidad Neta"
          value="$82,180.00"
          change="18.3%"
          isPositive={true}
          icon={Wallet}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card h-80 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground font-display">Cuentas por Cobrar vs Pagar</h3>
              <div className="flex gap-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                <div className="flex items-center"><span className="w-2.5 h-2.5 bg-primary rounded-full mr-1.5"></span> Por Cobrar</div>
                <div className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-300 dark:bg-blue-500 rounded-full mr-1.5"></span> Por Pagar</div>
              </div>
            </div>
            {/* Mock Chart Area */}
            <div className="flex-1 flex items-end justify-between gap-4 pt-4 border-b border-border pb-1">
              {[
                { label: 'Ene', val1: '45%', val2: '30%' },
                { label: 'Feb', val1: '60%', val2: '25%' },
                { label: 'Mar', val1: '75%', val2: '40%' },
                { label: 'Abr', val1: '55%', val2: '35%' },
                { label: 'May', val1: '85%', val2: '50%' },
                { label: 'Jun', val1: '70%', val2: '38%' },
              ].map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group font-sans">
                  <div className="w-full flex justify-center gap-1.5">
                    <div className="w-5 bg-primary rounded-t-custom transition-all duration-500" style={{ height: m.val1 }}></div>
                    <div className="w-5 bg-blue-300 dark:bg-blue-500/50 rounded-t-custom transition-all duration-500" style={{ height: m.val2 }}></div>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-foreground font-display">Facturas Pendientes</h3>
              <button className="text-xs text-primary font-bold hover:underline font-sans">Ver Todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold tracking-wider font-sans border-b border-border">
                  <tr>
                    <th className="px-6 py-4">ID Factura</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4 text-right">Monto</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm font-medium font-sans">
                  {[
                    { id: '#INV-2026-001', name: 'Acme Corp', amount: '$3,400.00', status: 'PENDIENTE', color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10' },
                    { id: '#INV-2026-004', name: 'Stark Industries', amount: '$8,120.00', status: 'VENCIDO', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10' },
                    { id: '#INV-2026-009', name: 'Wayne Ent.', amount: '$1,250.00', status: 'PENDIENTE', color: 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10' },
                  ].map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">{inv.id}</td>
                      <td className="px-6 py-4 text-foreground">{inv.name}</td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">{inv.amount}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[9px] font-black rounded-full ${inv.color}`}>{inv.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:opacity-80 transition-opacity"><Send className="w-4 h-4 inline" /></button>
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
              <h3 className="font-bold text-foreground font-display">Transacciones</h3>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-5">
              {[
                { name: 'Amazon Web Services', type: 'Suscripción', amount: '-$240.00', plus: false },
                { name: 'Global Tech Solutions', type: 'Consultoría', amount: '+$12,000.00', plus: true },
                { name: 'Office Realty Group', type: 'Alquiler', amount: '-$4,500.00', plus: false },
                { name: 'Starbucks Coffee', type: 'Viajes', amount: '-$12.45', plus: false },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer font-sans">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-custom flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors hover:shadow-inner">
                      {tx.plus ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{tx.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.type}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-black ${tx.plus ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{tx.amount}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 text-xs font-bold text-primary bg-card border border-border rounded-custom hover:border-primary transition-all font-sans">
              Descargar Estado
            </button>
          </div>

          <div className="card bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 -mr-8 -mt-8 rounded-full pointer-events-none"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-sm mb-1 opacity-80 font-display">Estado de Cuenta</h4>
              <p className="text-2xl font-black mb-4 font-display">$284,920.00</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-green-400 bg-white/10 w-fit px-2 py-1 rounded-full font-sans">
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
