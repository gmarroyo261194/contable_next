"use client";

import React, { useState } from "react";
import { Plus, Trash2, Users, Receipt, CreditCard, BookOpen, CheckCircle, Clock, CalendarDays, XCircle, AlertTriangle, Pencil, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { FacturaDocenteForm } from "@/components/FacturaDocenteForm";
import { deleteFacturaDocente, authorizeFacturaDocente, unauthorizeFacturaDocente } from "@/lib/actions/factura-docente-actions";
import { getMediosPago, updateMedioPagoAccount } from "@/lib/actions/pago-actions";
import { PaymentDialog } from "@/components/PaymentDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getCuentas, getAsientoById } from "@/lib/actions/asiento-actions";
import { AsientoForm } from "@/components/AsientoForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
  const [medios, setMedios] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [selectedAsiento, setSelectedAsiento] = useState<any>(null);
  const [isAsientoViewOpen, setIsAsientoViewOpen] = useState(false);
  const [isAsientoLoading, setIsAsientoLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "authorized" | "paid">("all");

  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    setAuthDate(new Date().toISOString().split('T')[0]);
    loadSettingsData();
  }, []);

  async function loadSettingsData() {
    const [m, c] = await Promise.all([getMediosPago(), getCuentas()]);
    setMedios(m);
    setCuentas(c);
  }

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

  const handleOpenAuth = (id: number) => {
    setAuthId(id);
    setAuthDate(new Date().toISOString().split('T')[0]);
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

  const toggleSelection = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleProcessPayment = () => {
    if (selectedIds.length === 0) return;

    // Validar misma entidad
    const firstInvoice = initialData.find(f => f.id === selectedIds[0]);
    const sameEntity = selectedIds.every(id => {
      const inv = initialData.find(f => f.id === id);
      return inv.entidadId === firstInvoice.entidadId;
    });

    if (!sameEntity) {
      toast.error("Todas las facturas seleccionadas deben pertenecer al mismo docente.");
      return;
    }

    // Validar estado Autorizado
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

  const selectedInvoices = initialData.filter(f => selectedIds.includes(f.id));

  const filteredData = initialData.filter(f => {
    if (filter === "all") return true;
    if (filter === "pending") return f.estado === "Autorizacion Pendiente" || !f.estado;
    if (filter === "authorized") return f.estado === "Autorizado" && !f.asientoPagoId;
    if (filter === "paid") return !!f.asientoPagoId;
    return true;
  });

  const columns = [
    {
      header: "",
      className: "w-10",
      cell: (f: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const habilitacion = f.fechaHabilitacionPago ? new Date(f.fechaHabilitacionPago) : null;
        const isFuture = habilitacion && habilitacion > today;

        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(f.id)}
            disabled={f.estado !== "Autorizado" || !!f.asientoPagoId || isFuture}
            onChange={() => toggleSelection(f.id)}
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary disabled:opacity-20 disabled:cursor-not-allowed"
          />
        );
      }
    },
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  f.asientoPagoId && handleViewAsiento(f.asientoPagoId);
                }}
                disabled={isAsientoLoading}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase border border-emerald-100 flex items-center gap-1 w-fit hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAsientoLoading ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                Pagado
              </button>
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
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleProcessPayment}
              className="flex items-center gap-2 bg-emerald-600 px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all font-display animate-in fade-in slide-in-from-right-4"
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
            onClick={() => {
              setEditingInvoice(null);
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
          >
            <Plus className="w-4 h-4" />
            Registrar Factura
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mb-4 bg-white/50 p-2 rounded-2xl border border-slate-100 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          {[
            { id: "all", label: "Todos", icon: Receipt },
            { id: "pending", label: "Pendientes", icon: Clock },
            { id: "authorized", label: "Autorizados", icon: CheckCircle },
            { id: "paid", label: "Pagados", icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:bg-slate-100"
                }`}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${filter === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-400"
                }`}>
                {initialData.filter(f => {
                  if (tab.id === "all") return true;
                  if (tab.id === "pending") return f.estado === "Autorizacion Pendiente" || !f.estado;
                  if (tab.id === "authorized") return f.estado === "Autorizado" && !f.asientoPagoId;
                  if (tab.id === "paid") return !!f.asientoPagoId;
                  return true;
                }).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <DataGrid
        data={filteredData}
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

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        description="Esta acción borrará el registro de forma permanente. No se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!unauthId}
        onClose={() => setUnauthId(null)}
        onConfirm={confirmUnauth}
        title="Quitar Autorización"
        description="La factura volverá al estado 'Pendiente de Autorización'."
        confirmText="Confirmar"
        variant="warning"
      />

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        selectedInvoices={selectedInvoices}
        onSuccess={() => {
          setSelectedIds([]);
          router.refresh();
        }}
      />

      <Dialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Configuración de Medios de Pago"
        maxWidth="max-w-lg"
      >
        <div className="space-y-6">
          <p className="text-xs text-slate-500 font-medium">Asocie cada medio de pago con su cuenta contable correspondiente para la generación automática de asientos.</p>

          <div className="space-y-4">
            {medios.map(m => (
              <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{m.nombre}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Cuenta Pagadora</span>
                </div>
                <select
                  value={m.cuentaId || ""}
                  onChange={async (e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    const res = await updateMedioPagoAccount(m.id, val);
                    if ("success" in res) {
                      toast.success(`Cuenta de ${m.nombre} actualizada.`);
                      loadSettingsData();
                    } else {
                      toast.error(res.error);
                    }
                  }}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all"
                >
                  <option value="">Sin asignar...</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsSettingsOpen(false)}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
          >
            Listo
          </button>
        </div>
      </Dialog>
      {/* Read-only Asiento Dialog */}
      <Dialog
        isOpen={isAsientoViewOpen}
        onClose={() => {
          setIsAsientoViewOpen(false);
          setSelectedAsiento(null);
        }}
        hideHeader
        noPadding
        maxWidth="max-w-screen-2xl"
      >
        <AsientoForm
          asientoToEdit={selectedAsiento}
          readOnly={true}
          onClose={() => {
            setIsAsientoViewOpen(false);
            setSelectedAsiento(null);
          }}
        />
      </Dialog>
    </div>
  );
}
