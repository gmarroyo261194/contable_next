"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  User, 
  AlertTriangle
} from "lucide-react";
import { DataGrid, GridConfig } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { anularPago } from "@/lib/actions/pago-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function PagosClient({ initialData }: { initialData: any[] }) {
  const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
  const [pagoToAnular, setPagoToAnular] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleAnular = async () => {
    if (!pagoToAnular) return;
    
    setLoading(true);
    try {
      const result = await anularPago(pagoToAnular.id);
      if ("success" in result) {
        toast.success("Pago anulado correctamente.");
        setIsAnularDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al anular el pago.");
    } finally {
      setLoading(false);
    }
  };

  const config: GridConfig<any> = {
    columns: [
      {
        key: "fecha",
        header: "Fecha",
        sortable: true,
        render: (p: any) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{new Date(p.fecha).toLocaleDateString()}</span>
            <span className="text-[10px] text-slate-400 font-medium">Ref: #{p.id}</span>
          </div>
        )
      },
      {
        key: "id",
        header: "Empresa / Ejercicio",
        render: (p: any) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[150px]">
              {p.ejercicio?.empresa?.nombreFantasia || p.ejercicio?.empresa?.razonSocial}
            </span>
            <span className="text-[9px] font-bold text-slate-400">
              Eje. {p.ejercicio?.numero}
            </span>
          </div>
        )
      },
      {
        key: "id",
        header: "Beneficiario",
        render: (p: any) => (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <User className="size-3.5" />
            </div>
            <span className="font-bold text-slate-700">{p.entidad.nombre}</span>
          </div>
        )
      },
      {
        key: "id",
        header: "Medio de Pago",
        render: (p: any) => (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-600">{p.medioPago.nombre}</span>
            <span className="text-[10px] text-slate-400 uppercase font-black">Asiento #{p.asientoId}</span>
          </div>
        )
      },
      {
        key: "id",
        header: "Documentos",
        render: (p: any) => (
          <div className="flex flex-wrap gap-1">
            {p.facturasDocentes?.map((f: any) => (
              <span key={f.id} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded border border-slate-200" title={`Importe: $ ${Number(f.importe).toFixed(2)}`}>
                {f.puntoVenta}-{f.numero}
              </span>
            ))}
          </div>
        )
      },
      {
        key: "importeTotal",
        header: "Importe",
        type: "currency",
        className: "text-right",
        sortable: true
      },
      {
        key: "anulado",
        header: "Estado",
        sortable: true,
        render: (p: any) => (
          p.anulado ? (
            <div className="flex flex-col">
              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full uppercase border border-red-100 flex items-center gap-1 w-fit">
                <XCircle className="size-3" /> Anulado
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Rev: #{p.asientoAnulacionId}</span>
            </div>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase border border-emerald-100 flex items-center gap-1 w-fit">
              <CheckCircle className="size-3" /> Aplicado
            </span>
          )
        )
      },
      { key: "actions", header: "Acciones", className: "text-right" }
    ],
    actions: [
      {
        label: "Anular Pago",
        icon: RotateCcw,
        onClick: (p) => {
          setPagoToAnular(p);
          setIsAnularDialogOpen(true);
        },
        variant: "danger",
        showIf: (p) => !p.anulado
      }
    ]
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-slate-800 font-display">Historial de Pagos</h2>
          </div>
          <p className="text-slate-500 text-sm">Registro centralizado de egresos y documentos cancelados</p>
        </div>
      </header>

      <DataGrid
        data={initialData}
        config={config}
      />

      <Dialog
        isOpen={isAnularDialogOpen}
        onClose={() => setIsAnularDialogOpen(false)}
        title="Anular Pago"
        maxWidth="max-w-md"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <div className="size-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 mt-1">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-red-900">¿Anular este pago?</h4>
              <p className="text-xs text-red-700 leading-relaxed mt-1">
                Esto generará un **contra-asiento automático** para revertir contablemente el egreso y liberará los comprobantes vinculados (volverán a estado Autorizado).
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase">Beneficiario</span>
              <span className="text-slate-800">{pagoToAnular?.entidad.nombre}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase">Importe Total</span>
              <span className="text-slate-800">$ {Number(pagoToAnular?.importeTotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500 uppercase">Comprobantes</span>
              <span className="text-slate-800">{pagoToAnular?.facturasDocentes.length} unidad(es)</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsAnularDialogOpen(false)}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleAnular}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 rounded-xl font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Confirmar Anulación
            </button>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
}
