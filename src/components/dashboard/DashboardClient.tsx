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
        {/* <div className="flex gap-3">
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
        </div> */}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Documentos Proveedores"
          value={formatCurrency(stats.proveedores.total)}
          change={`${stats.proveedores.count} documentos`}
          isPositive={true}
          icon={FileText}
          iconColor="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-500"
        />
        <SummaryCard
          title="Facturas Emitidas"
          value={formatCurrency(stats.facturasEmitidas.total)}
          change={`${stats.facturasEmitidas.count} comprobantes`}
          isPositive={true}
          icon={Receipt}
          iconColor="text-green-600 dark:text-green-400"
          bgColor="bg-green-500"
        />
        <SummaryCard
          title="Honorarios Docentes"
          value={formatCurrency(stats.honorariosDocentes.total)}
          change={`${stats.honorariosDocentes.count} registros`}
          isPositive={true}
          icon={GraduationCap}
          iconColor="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-500"
        />
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
