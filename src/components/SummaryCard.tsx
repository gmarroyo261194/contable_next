import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  paidValue: string;
  pendingValue: string;
  paidLabel?: string;
  pendingLabel?: string;
}

/**
 * Tarjeta de resumen estadístico detallada.
 * Muestra montos pagados y pendientes con etiquetas descriptivas.
 * 
 * @param {SummaryCardProps} props - Propiedades de la tarjeta.
 * @returns {JSX.Element} Tarjeta con desglose de pagos.
 */
export function SummaryCard({ 
  title, 
  icon: Icon, 
  iconColor, 
  bgColor,
  paidValue,
  pendingValue,
  paidLabel = "Pagado",
  pendingLabel = "Pendiente"
}: SummaryCardProps) {
  return (
    <div className="card transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bgColor} rounded-custom bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className="text-xs text-muted-foreground font-bold font-display uppercase tracking-wider">{title}</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase mb-0.5">{paidLabel}</p>
          <p className="text-xl font-bold text-foreground leading-none">{paidValue}</p>
        </div>
        
        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase mb-0.5">{pendingLabel}</p>
          <p className="text-lg font-bold text-foreground/80 leading-none">{pendingValue}</p>
        </div>
      </div>
    </div>
  );
}
