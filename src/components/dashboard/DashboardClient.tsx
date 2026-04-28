"use client";

import React from 'react';
import {
  FileText,
  Receipt,
  GraduationCap,
  Upload,
  Plus
} from 'lucide-react';
import { SummaryCard } from '@/components/SummaryCard';
import { Dialog } from '@/components/Dialog';
import { AsientoForm } from '@/components/AsientoForm';
import { useSession } from "next-auth/react";
import { DashboardStats } from '@/lib/actions/dashboard-actions';

interface DashboardClientProps {
  stats: DashboardStats;
}

/**
 * Componente cliente para el dashboard principal.
 * Muestra resúmenes de documentos de proveedores, facturas y honorarios.
 * 
 * @param {DashboardClientProps} props - Estadísticas obtenidas del servidor.
 * @returns {JSX.Element} Vista principal del dashboard con datos reales.
 */
export default function DashboardClient({ stats }: DashboardClientProps) {
  const [isAsientoDialogOpen, setIsAsientoDialogOpen] = React.useState(false);
  const { data: session } = useSession();

  // Formateador de moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  return (
    <div className="p-8 animate-in fade-in duration-500">
      {/* Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground font-display italic">
            Hola, {session?.user?.name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground text-sm font-sans">
            Panel de control - {(session?.user as any)?.empresaNombre || 'Sin empresa seleccionada'}
            {(session?.user as any)?.ejercicioNombre && ` (Ejercicio ${(session?.user as any)?.ejercicioNombre})`}
          </p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Documentos Proveedores"
          paidValue={formatCurrency(stats.proveedores.totalPagado)}
          pendingValue={formatCurrency(stats.proveedores.totalPendiente)}
          paidLabel={`Pagados (${stats.proveedores.countPagado})`}
          pendingLabel={`Adeudados (${stats.proveedores.countPendiente})`}
          icon={FileText}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500"
        />
        <SummaryCard
          title="Facturas Emitidas"
          paidValue={formatCurrency(stats.facturasEmitidas.totalPagado)}
          pendingValue={formatCurrency(stats.facturasEmitidas.totalPendiente)}
          paidLabel={`Cobradas (${stats.facturasEmitidas.countPagado})`}
          pendingLabel={`Pendientes (${stats.facturasEmitidas.countPendiente})`}
          icon={Receipt}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-500"
        />
        <SummaryCard
          title="Honorarios Docentes"
          paidValue={formatCurrency(stats.honorariosDocentes.totalPagado)}
          pendingValue={formatCurrency(stats.honorariosDocentes.totalPendiente)}
          paidLabel={`Pagados (${stats.honorariosDocentes.countPagado})`}
          pendingLabel={`Pendientes (${stats.honorariosDocentes.countPendiente})`}
          icon={GraduationCap}
          iconColor="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-500"
        />
      </div>

      {/* Income Distribution (Participations) */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 font-display">Distribución de Ingresos (Participaciones)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">Total Fundación</p>
                <p className="text-2xl font-black text-foreground">{formatCurrency(stats.facturasEmitidas.totalFundacion)}</p>
              </div>
            </div>
          </div>
          <div className="card bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Total Departamentos</p>
                <p className="text-2xl font-black text-foreground">{formatCurrency(stats.facturasEmitidas.totalDepartamentos)}</p>
              </div>
            </div>
            
            {/* Department Breakdown */}
            <div className="space-y-2 mt-2 pt-4 border-t border-emerald-100 dark:border-emerald-500/10 overflow-y-auto max-h-32 pr-2 custom-scrollbar">
              {stats.facturasEmitidas.participacionesDepto.length > 0 ? (
                stats.facturasEmitidas.participacionesDepto.map((depto, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground font-medium truncate max-w-[180px]">{depto.nombre}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(depto.total)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic">No hay participaciones por departamento</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content Area - Simplified for now as requested to remove test data */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground font-display mb-2">Bienvenido a ContableNext</h3>
            <p className="text-muted-foreground max-w-md mx-auto font-sans">
              Utilice el menú lateral para acceder a la gestión de asientos, documentos y reportes contables.
              Las estadísticas superiores se actualizan en tiempo real con la información de su empresa.
            </p>
          </section>
        </div>
      </div>

      {/* Asiento Form Dialog */}
      <Dialog isOpen={isAsientoDialogOpen} onClose={() => setIsAsientoDialogOpen(false)}>
        <AsientoForm onClose={() => setIsAsientoDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
