import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

/**
 * Tarjeta de resumen estadístico.
 * Muestra un valor, un cambio porcentual y un icono representativo.
 * 
 * @param {SummaryCardProps} props - Propiedades de la tarjeta.
 * @returns {JSX.Element} Tarjeta con estilo consistente.
 */
export function SummaryCard({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon: Icon, 
  iconColor, 
  bgColor 
}: SummaryCardProps) {
  return (
    <div className="card transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bgColor} rounded-custom bg-opacity-10 dark:bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          isPositive 
            ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-500/10' 
            : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
        }`}>
          {isPositive ? '+' : ''}{change}
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
