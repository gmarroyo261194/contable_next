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
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bgColor} rounded-custom`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
        }`}>
          {isPositive ? '+' : ''}{change}
        </span>
      </div>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
