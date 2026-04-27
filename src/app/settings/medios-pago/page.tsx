"use client";

import React from "react";
import { MediosPagoManager } from "@/components/MediosPagoManager";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MediosPagoPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <Link 
            href="/settings"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="size-3" />
            Volver a Ajustes
          </Link>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="size-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">Medios de Pago</h2>
          </div>
          <p className="text-slate-500 text-sm">Gestiona tus canales de flujo de caja y sus cuentas contables</p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <MediosPagoManager />
      </div>

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
        <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <CreditCard className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Importante sobre los Asientos</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Cada vez que proceses un pago, el sistema buscará la cuenta contable asociada al medio de pago para registrar el movimiento en el Haber. 
            Si un medio de pago no tiene cuenta, no se podrán procesar pagos con él.
          </p>
        </div>
      </div>
    </div>
  );
}
