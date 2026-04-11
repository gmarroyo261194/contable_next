"use client";

import React, { useState } from "react";
import { Plus, Trash2, Users, Receipt, Calendar, CreditCard, Hash, BookOpen, CheckCircle, Clock, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { FacturaDocenteForm } from "@/components/FacturaDocenteForm";
import { deleteFacturaDocente, authorizeFacturaDocente } from "@/lib/actions/factura-docente-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FacturaDocenteClient({ initialData }: { initialData: any[] }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [authId, setAuthId] = useState<number | null>(null);
  const [authDate, setAuthDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta factura?")) {
      const result = await deleteFacturaDocente(id);
      if (result.success) {
        toast.success("Factura eliminada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleOpenAuth = (id: number) => {
    setAuthId(id);
    setAuthDate(new Date().toISOString().split('T')[0]);
  };

  const handleConfirmAuth = async () => {
    if (!authId) return;
    const result = await authorizeFacturaDocente(authId, authDate);
    if (result.success) {
      toast.success("Factura autorizada.");
      setAuthId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };


  const columns = [
    {
      header: "Docente",
      accessor: "entidad.nombre",
      cell: (f: any) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <Users className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">{f.entidad.nombre}</span>
            <span className="text-[10px] text-slate-400 font-medium">{f.entidad.cuit || f.entidad.nroDoc}</span>
          </div>
        </div>
      )
    },
    { 
      header: "Comprobante", 
      cell: (f: any) => (
        <div className="font-mono text-xs font-bold text-slate-600">
          {f.puntoVenta}-{f.numero}
        </div>
      )
    },
    { 
      header: "Fecha", 
      accessor: "fecha", 
      cell: (f: any) => new Date(f.fecha).toLocaleDateString() 
    },
    { 
      header: "Período", 
      cell: (f: any) => (
        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-black text-slate-500 uppercase">
          {f.mesHonorarios}/{f.anioHonorarios}
        </span>
      )
    },
    { 
      header: "Importe", 
      accessor: "importe",
      className: "text-right",
      cell: (f: any) => (
        <span className="font-black text-slate-900">
          $ {Number(f.importe).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: "Estado",
      cell: (f: any) => {
        const isPaid = !!f.asientoPagoId;
        const isAuthorized = f.estado === "Autorizado";
        const isPending = f.estado === "Autorizacion Pendiente";

        if (isPaid) {
          return (
            <div className="flex flex-col">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase border border-emerald-100 flex items-center gap-1 w-fit">
                <CheckCircle className="size-3" /> Pagado
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Asiento #{f.asientoPagoId}</span>
            </div>
          );
        }

        if (isAuthorized) {
          return (
            <div className="flex flex-col">
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase border border-blue-100 flex items-center gap-1 w-fit">
                <CheckCircle className="size-3" /> Autorizado
              </span>
              {f.fechaHabilitacionPago && (
                <span className="text-[9px] text-blue-500 font-bold mt-0.5">
                  Pago desde: {new Date(f.fechaHabilitacionPago).toLocaleDateString()}
                </span>
              )}
              {f.fechaAutorizado && (
                <span className="text-[9px] text-slate-400 mt-0.5">
                  Aut. {new Date(f.fechaAutorizado).toLocaleDateString()} por {f.usuarioAutorizado}
                </span>
              )}
            </div>
          );
        }

        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase border border-amber-100 flex items-center gap-1 w-fit">
            <Clock className="size-3" /> Pendiente Aut.
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold text-slate-800 font-display">Facturas de Docentes</h2>
          </div>
          <p className="text-slate-500 text-sm">Registro de honorarios y comprobantes</p>
        </div>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
        >
          <Plus className="w-4 h-4" />
          Registrar Factura
        </button>
      </header>

      <DataGrid
        data={initialData}
        columns={columns as any}
        actions={(item) => (
          <>
            {(!item.estado || item.estado === "Autorizacion Pendiente") && !item.asientoPagoId && (
              <button
                onClick={() => handleOpenAuth(item.id)}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Autorizar"
              >
                <CheckCircle className="size-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      />

      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        hideHeader
        noPadding
        maxWidth="max-w-2xl"
      >
        <FacturaDocenteForm
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>

      <Dialog
        isOpen={!!authId}
        onClose={() => setAuthId(null)}
        title="Autorizar Pago"
        maxWidth="max-w-md"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900">Fecha de Habilitación</h4>
              <p className="text-xs text-blue-700 leading-relaxed mt-1">
                Especifique la fecha a partir de la cual se permitirá realizar el pago de esta factura docente.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">Fecha Programada</label>
            <input
              type="date"
              value={authDate}
              onChange={(e) => setAuthDate(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-700 focus:border-blue-500 focus:ring-0 transition-all outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setAuthId(null)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmAuth}
              className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
}
