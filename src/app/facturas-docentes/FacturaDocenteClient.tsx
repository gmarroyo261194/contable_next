"use client";

import React, { useState } from "react";
import { Plus, Receipt, CreditCard, CalendarDays, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { FacturaDocenteForm } from "@/components/FacturaDocenteForm";
import { deleteFacturaDocente, authorizeFacturaDocente, unauthorizeFacturaDocente } from "@/lib/actions/factura-docente-actions";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAsientoById } from "@/lib/actions/asiento-actions";
import { AsientoForm } from "@/components/AsientoForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MediosPagoManager } from "@/components/MediosPagoManager";
import { facturasDocentesGridConfig } from "@/lib/configs/facturas-docentes.config";

export function FacturaDocenteClient({ initialData }: { initialData: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [authId, setAuthId] = useState<number | null>(null);
  const [authDate, setAuthDate] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [unauthId, setUnauthId] = useState<number | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAsiento, setSelectedAsiento] = useState<any>(null);
  const [isAsientoViewOpen, setIsAsientoViewOpen] = useState(false);
  const [isAsientoLoading, setIsAsientoLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "authorized" | "paid">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    setAuthDate(new Date().toISOString().split('T')[0]);
  }, []);

  if (!mounted) return null;

  const confirmDelete = async () => {
    if (!deleteId) return;
    const result = await deleteFacturaDocente(deleteId);
    if ("success" in result) {
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
    if ("success" in result) {
      toast.success("Autorización quitada.");
      setUnauthId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleConfirmAuth = async () => {
    if (!authId) return;
    const result = await authorizeFacturaDocente(authId, authDate);
    if ("success" in result) {
      toast.success("Factura autorizada.");
      setAuthId(null);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleProcessPayment = () => {
    if (selectedIds.length === 0) return;
    const firstInvoice = initialData.find(f => f.id === selectedIds[0]);
    const sameEntity = selectedIds.every(id => initialData.find(f => f.id === id).entidadId === firstInvoice.entidadId);
    if (!sameEntity) {
      toast.error("Todas las facturas seleccionadas deben pertenecer al mismo docente.");
      return;
    }
    const allAuthorized = selectedIds.every(id => {
      const inv = initialData.find(f => f.id === id);
      return inv.estado === "Autorizado" && !inv.asientoPagoId;
    });
    if (!allAuthorized) {
      toast.error("Solo se pueden pagar facturas autorizadas y no pagadas.");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleViewAsiento = async (asientoId: number) => {
    setIsAsientoLoading(true);
    try {
      const result = await getAsientoById(asientoId);
      if (result) {
        setSelectedAsiento(result);
        setIsAsientoViewOpen(true);
      } else {
        toast.error("No se pudo cargar el asiento.");
      }
    } catch (err) {
      toast.error("Error al obtener datos del asiento.");
    } finally {
      setIsAsientoLoading(false);
    }
  };

  const config = facturasDocentesGridConfig({
    onEdit: (f) => { setEditingInvoice(f); setIsDialogOpen(true); },
    onAutorizar: (id) => { setAuthId(id); setAuthDate(new Date().toISOString().split('T')[0]); },
    onQuitarAutorizacion: (id) => setUnauthId(id),
    onEliminar: (id) => setDeleteId(id),
    onViewAsiento: handleViewAsiento
  }, { isAsientoLoading });

  const filteredData = initialData.filter(f => {
    if (filter === "pending") return f.estado === "Autorizacion Pendiente" || !f.estado;
    if (filter === "authorized") return f.estado === "Autorizado" && !f.asientoPagoId;
    if (filter === "paid") return !!f.asientoPagoId;
    return true;
  });

  const selectedInvoices = initialData.filter(f => selectedIds.includes(f.id));

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-primary" />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Facturas de Docentes</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleProcessPayment}
              className="flex items-center gap-2 bg-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Pagar Selección ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
            title="Medios de Pago"
          >
            <CreditCard className="size-5" />
          </button>
          <button
            onClick={() => { setEditingInvoice(null); setIsDialogOpen(true); }}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Registrar Factura
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between bg-white/50 p-2 rounded-2xl border border-slate-100 backdrop-blur-sm overflow-x-auto gap-2">
        <div className="flex items-center gap-1">
          {["all", "pending", "authorized", "paid"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100"}`}
            >
              {t === "all" ? "Todos" : t === "pending" ? "Pendientes" : t === "authorized" ? "Autorizados" : "Pagados"}
            </button>
          ))}
        </div>
      </div>

      <DataGrid
        config={config}
        data={filteredData}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar docente o número..."
      />

      <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} hideHeader noPadding maxWidth={editingInvoice?.asientoPagoId || editingInvoice?.fechaAutorizado ? "max-w-5xl" : "max-w-2xl"}>
        <FacturaDocenteForm invoice={editingInvoice} onClose={() => { setIsDialogOpen(false); setEditingInvoice(null); }} onSuccess={() => router.refresh()} />
      </Dialog>

      <Dialog isOpen={!!authId} onClose={() => setAuthId(null)} title="Autorizar Pago" maxWidth="max-w-md">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Habilitación de Pago</label>
            <input type="date" value={authDate} onChange={(e) => setAuthDate(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-slate-700 focus:border-blue-500 outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAuthId(null)} className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancelar</button>
            <button onClick={handleConfirmAuth} className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg hover:bg-blue-700">Confirmar</button>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Confirmar Eliminación" description="Esta acción no se puede deshacer." confirmText="Eliminar" variant="danger" />
      <ConfirmDialog isOpen={!!unauthId} onClose={() => setUnauthId(null)} onConfirm={confirmUnauth} title="Quitar Autorización" description="La factura volverá al estado pendiente." confirmText="Confirmar" variant="warning" />
      
      <PaymentDialog isOpen={isPaymentDialogOpen} onClose={() => setIsPaymentDialogOpen(false)} selectedInvoices={selectedInvoices} onSuccess={() => { setSelectedIds([]); router.refresh(); }} />
      
      <Dialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Medios de Pago" maxWidth="max-w-lg">
        <MediosPagoManager />
      </Dialog>

      <Dialog isOpen={isAsientoViewOpen} onClose={() => { setIsAsientoViewOpen(false); setSelectedAsiento(null); }} hideHeader noPadding maxWidth="max-w-screen-2xl">
        <AsientoForm asientoToEdit={selectedAsiento} readOnly={true} onClose={() => { setIsAsientoViewOpen(false); setSelectedAsiento(null); }} />
      </Dialog>
    </div>
  );
}
