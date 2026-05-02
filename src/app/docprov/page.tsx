"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  CalendarDays,
  DollarSign,
  CheckCircle2,
  Search
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getDocumentosProveedores, anularDocumentoProveedor, deleteDocumentoProveedor, autorizarDocumentoProveedor, pagarDocumentoProveedor } from "@/lib/actions/doc-prov-actions";
import DocumentoProveedorModal from "@/components/proveedores/DocumentoProveedorModal";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { AccountSearchDialog } from "@/components/AccountSearchDialog";
import { getModulos } from "@/lib/actions/module-actions";
import { toast } from "sonner";
import { DataGrid } from "@/components/ui/DataGrid";
import { docProvGridConfig } from "@/lib/configs/docprov.config";

export default function DocumentosProveedoresPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [docToAuth, setDocToAuth] = useState<any | null>(null);
  const [fechaAuth, setFechaAuth] = useState(new Date().toISOString().split('T')[0]);

  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [docToPay, setDocToPay] = useState<any | null>(null);
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [selectedPayingAccount, setSelectedPayingAccount] = useState<any | null>(null);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);

  const { data: session } = useSession();
  const { ejercicioId: storeEjercicioId } = useAppStore();
  const ejercicioId = storeEjercicioId || (session?.user as any)?.ejercicioId;

  const isContabilidadEnabled = activeModules.includes("CONTABILIDAD");

  const loadDocumentos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDocumentosProveedores();
      setDocumentos(data);
    } catch (error) {
      console.error("Error loading documentos:", error);
      toast.error("Error al cargar los documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocumentos();
    getCuentas().then(setCuentas);
    getModulos().then(mods => setActiveModules(mods.filter(m => m.activo).map(m => m.codigo)));
  }, [loadDocumentos, ejercicioId]);

  const handleAnular = async (id: number) => {
    if (!confirm("¿Está seguro de que desea anular este documento? Se generará un contra-asiento automático.")) {
      return;
    }
    try {
      const res = await anularDocumentoProveedor(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Documento anulado correctamente.");
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al intentar anular el documento.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento? Esta acción es irreversible.")) {
      return;
    }
    try {
      const res = await deleteDocumentoProveedor(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Documento eliminado.");
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al intentar eliminar el documento.");
    }
  };

  const handleAutorizar = async () => {
    if (!docToAuth) return;
    try {
      const res = await autorizarDocumentoProveedor(docToAuth.id, fechaAuth);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Documento autorizado para pago.");
        setIsAuthModalOpen(false);
        setDocToAuth(null);
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al autorizar el documento.");
    }
  };

  const handlePagar = async () => {
    if (!docToPay || !selectedPayingAccount) {
      toast.error("Debe seleccionar una cuenta pagadora.");
      return;
    }
    try {
      const res = await pagarDocumentoProveedor(docToPay.id, selectedPayingAccount.id, fechaPago);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Pago registrado.");
        setIsPaymentModalOpen(false);
        setDocToPay(null);
        setSelectedPayingAccount(null);
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al procesar el pago.");
    }
  };

  const config = docProvGridConfig({
    onEdit: (doc) => { setSelectedDocForEdit(doc); setIsModalOpen(true); },
    onAnular: handleAnular,
    onDelete: handleDelete,
    onAutorizar: (doc) => { setDocToAuth(doc); setIsAuthModalOpen(true); },
    onPagar: (doc) => { setDocToPay(doc); setIsPaymentModalOpen(true); }
  }, { isContabilidadEnabled });

  const totalPeriodo = documentos.reduce((acc, doc) => acc + (doc.anulado ? 0 : Number(doc.montoTotal)), 0);

  const fmtImporte = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="w-full mx-auto space-y-6">
        {!isContabilidadEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center gap-3 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight">Módulo Contable Desactivado</p>
              <p className="text-xs font-medium opacity-80">Las funciones de registro de pagos y generación de asientos automáticos están suspendidas.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facturas de Proveedores</h1>
            <p className="text-slate-500 font-medium">Registro y control de documentos de gastos y compras.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelectedDocForEdit(null); setIsModalOpen(true); }}
              className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 font-bold"
            >
              <Plus className="w-5 h-5" />
              Nueva Factura
            </button>
            <button
              onClick={loadDocumentos}
              className="p-3 bg-white text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Periodo</span>
              <p className="text-xl font-black text-slate-900">{fmtImporte(totalPeriodo)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <DataGrid
            config={config}
            data={documentos}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por proveedor, número o tipo..."
          />
        </div>
      </div>

      <DocumentoProveedorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocForEdit(null);
        }}
        onSuccess={loadDocumentos}
        documento={selectedDocForEdit}
      />

      {/* Authorization Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Autorizar Pago</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Factura {docToAuth?.numero}</p>
                </div>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                  Fecha Permitida de Pago
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={fechaAuth}
                  onChange={(e) => setFechaAuth(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsAuthModalOpen(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">CANCELAR</button>
                <button onClick={handleAutorizar} className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <ShieldCheck className="w-4 h-4" />
                  AUTORIZAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Registrar Pago</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proveedor: {docToPay?.entidad?.nombre}</p>
                </div>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Factura</span>
                  <span className="text-lg font-black text-slate-900">{fmtImporte(docToPay?.montoTotal || 0)}</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuenta Pagadora</label>
                  <button
                    type="button"
                    onClick={() => setIsAccountSelectorOpen(true)}
                    className={`w-full text-left bg-slate-50 border-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all flex items-center justify-between group ${selectedPayingAccount ? "text-slate-900 border-indigo-100 bg-white" : "text-slate-400 border-transparent hover:border-indigo-100"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Search className={`w-4 h-4 ${selectedPayingAccount ? "text-indigo-500" : "text-slate-300"}`} />
                      <span>{selectedPayingAccount ? selectedPayingAccount.nombre : "Seleccionar cuenta..."}</span>
                    </div>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Pago</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 focus:border-indigo-100 transition-all"
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 py-4 text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95">CANCELAR</button>
                <button onClick={handlePagar} disabled={!selectedPayingAccount} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRMAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AccountSearchDialog
        isOpen={isAccountSelectorOpen}
        onClose={() => setIsAccountSelectorOpen(false)}
        cuentas={cuentas}
        onSelect={(cuenta) => {
          setSelectedPayingAccount(cuenta);
          setIsAccountSelectorOpen(false);
        }}
      />
    </div>
  );
}
