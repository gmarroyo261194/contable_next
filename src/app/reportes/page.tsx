"use client";

import React from 'react';
import Link from 'next/link';
import { BookOpen, Scale } from 'lucide-react';

export default function ReportesPage() {
  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-display">Reportes Contables</h2>
        <p className="text-slate-500 mt-2 font-medium">Seleccione el reporte que desea visualizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/reportes/mayores"
          className="group block p-6 bg-white border border-slate-200 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-blue-600">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">Libro Mayor</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Visualice cronológicamente los movimientos de una o varias cuentas contables. Incluye saldo anterior de arrastre y saldos acumulados por renglón.
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/reportes/balance"
          className="group block p-6 bg-white border border-slate-200 rounded-2xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-indigo-600">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">Balance de Sumas y Saldos</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Resumen general de todas las cuentas del plan, agrupando débitos, créditos y saldos finales jerárquicamente.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
