"use client";

import React, { useState } from "react";
import { Plus, Trash2, Users, Receipt, Calendar, CreditCard, Hash, BookOpen, CheckCircle, Clock, CalendarDays, XCircle, AlertTriangle, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { FacturaDocenteForm } from "@/components/FacturaDocenteForm";
import { deleteFacturaDocente, authorizeFacturaDocente, unauthorizeFacturaDocente } from "@/lib/actions/factura-docente-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FacturaDocenteClient({ initialData }: { initialData: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [authId, setAuthId] = useState<number | null>(null);
  const [authDate, setAuthDate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [unauthId, setUnauthId] = useState<number | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    setAuthDate(new Date().toISOString().split('T')[0]);
  }, []);

  if (!mounted) return null;

  const confirmDelete = async () => {
    if (!deleteId) return;
    const result = await deleteFacturaDocente(deleteId);
    if (result.success) {
      toast.success("Factura eliminada.");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const confirmUnauth = async () => {
    if (!unauthId) return;
    const result = await unauthorizeFacturaDocente(unauthId);
    if (result.success) {
      toast.success("Autorización quitada.");
      setUnauthId(null);
      router.refresh();
    } else {
      toast.error(result.error);
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
          {/* <p className="text-slate-500 text-sm">Registro de honorarios y comprobantes</p> */}
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setIsDialogOpen(true);
          }}
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
            <button
              onClick={() => {
                setEditingInvoice(item);
                setIsDialogOpen(true);
              }}
              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all border border-blue-100 shadow-sm"
              title="Editar"
            >
              <Pencil className="size-4" />
            </button>
            {(!item.estado || item.estado === "Autorizacion Pendiente") && !item.asientoPagoId && (
              <button
                onClick={() => handleOpenAuth(item.id)}
                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-100 shadow-sm"
                title="Autorizar"
              >
                <CheckCircle className="size-4" />
              </button>
            )}
            {item.estado === "Autorizado" && !item.asientoPagoId && (
              <button
                onClick={() => setUnauthId(item.id)}
                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all border border-amber-100 shadow-sm"
                title="Quitar Autorización"
              >
                <XCircle className="size-4" />
              </button>
            )}
            <button
              onClick={() => setDeleteId(item.id)}
              className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-100 shadow-sm"
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
          invoice={editingInvoice}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingInvoice(null);
          }}
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

      {/* Confirmación de Eliminación */}
      <Dialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirmar Eliminación"
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
              <h4 className="font-bold text-red-900">¿Eliminar esta factura?</h4>
              <p className="text-xs text-red-700 leading-relaxed mt-1">
                Esta acción borrará el registro de forma permanente. No se puede deshacer.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-6 py-3 bg-red-600 rounded-xl font-bold text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              Eliminar
            </button>
          </div>
        </motion.div>
      </Dialog>

      {/* Confirmación de Quitar Autorización */}
      <Dialog
        isOpen={!!unauthId}
        onClose={() => setUnauthId(null)}
        title="Quitar Autorización"
        maxWidth="max-w-md"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="size-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shrink-0 mt-1">
              <XCircle className="size-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">¿Revertir autorización?</h4>
              <p className="text-xs text-amber-700 leading-relaxed mt-1">
                La factura volverá al estado "Pendiente de Autorización".
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setUnauthId(null)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={confirmUnauth}
              className="flex-1 px-6 py-3 bg-amber-600 rounded-xl font-bold text-white shadow-lg shadow-amber-200 hover:bg-amber-700 transition-all"
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
}
