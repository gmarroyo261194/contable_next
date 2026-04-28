"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Edit,
  ExternalLink,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  CalendarDays,
  Lock,
  Unlock
} from "lucide-react";
import { format } from "date-fns";
import { useAppStore } from "@/store/useAppStore";
import { getDocumentosProveedores, anularDocumentoProveedor, deleteDocumentoProveedor, autorizarDocumentoProveedor, pagarDocumentoProveedor } from "@/lib/actions/doc-prov-actions";
import DocumentoProveedorModal from "@/components/proveedores/DocumentoProveedorModal";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { AccountSearchDialog } from "@/components/AccountSearchDialog";
import { getModulos } from "@/lib/actions/module-actions";
import { toast } from "sonner";

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

  const filteredDocs = documentos.filter(doc =>
    doc.entidad?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.numero?.includes(searchTerm) ||
    doc.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!confirm("¿Está seguro de que desea eliminar este documento? Esta acción es irreversible y solo posible si no hay asiento contable.")) {
      return;
    }

    try {
      const res = await deleteDocumentoProveedor(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Documento eliminado físicamente.");
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
        toast.success("Pago registrado y asiento generado.");
        setIsPaymentModalOpen(false);
        setDocToPay(null);
        setSelectedPayingAccount(null);
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al procesar el pago.");
    }
  };

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

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
              <FileText className="w-4 h-4" />
              Gestión de Compras
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facturas de Proveedores</h1>
            <p className="text-slate-500 font-medium">
              Registra y controla los documentos de gastos y compras de la empresa.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedDocForEdit(null);
                setIsModalOpen(true);
              }}
              className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl
                hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 font-bold"
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

        {/* Search & Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm p-2 flex items-center gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por proveedor, número o tipo..."
                className="w-full bg-transparent border-none rounded-2xl pl-12 pr-4 py-3 text-slate-700 placeholder:text-slate-400
                  focus:ring-0 outline-none transition-all font-medium"
              />
            </div>
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          <div className="bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-100 p-4 flex flex-col justify-center">
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Total Periodo</span>
            <span className="text-xl font-black text-white">
              {fmtImporte(filteredDocs.reduce((acc, doc) => acc + (doc.anulado ? 0 : Number(doc.montoTotal)), 0))}
            </span>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-32 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold">Obteniendo documentos...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-32 text-center max-w-sm mx-auto space-y-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                  <Search className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Sin movimientos</h3>
                <p className="text-sm text-slate-500 font-medium">No se encontraron facturas de proveedores registradas para los filtros aplicados.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Comprobante</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Detalle</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Autorización</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Contable</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Pago</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className={`group transition-all duration-200 ${doc.anulado ? 'opacity-50 grayscale bg-slate-50/50' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-700 font-bold text-sm">{format(new Date(doc.fecha), 'dd/MM/yyyy')}</div>
                        {doc.vencimiento && (
                          <div className="text-[10px] text-rose-500 font-black uppercase mt-0.5">Vence {format(new Date(doc.vencimiento), 'dd/MM/yyyy')}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            {doc.tipo} {doc.letra} {doc.numero}
                          </span>
                          {doc.cai && (
                            <span className="text-[9px] text-slate-400 font-mono">CAI: {doc.cai}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm truncate max-w-[250px]">{doc.entidad?.nombre}</span>
                          <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">
                            {doc.ejercicio?.empresa?.nombreFantasia}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 max-w-[200px]">
                          {doc.detalle || <span className="italic text-slate-300">Sin detalle</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-black tracking-tight ${doc.anulado ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {fmtImporte(doc.montoTotal)}
                        </div>
                        {Number(doc.retencion) > 0 && (
                          <div className="text-[10px] text-rose-500 font-bold">Ret. {fmtImporte(doc.retencion)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {doc.autorizado ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">Autorizado</span>
                            </div>
                            {doc.fechaAutorizacionPago && (
                              <span className="text-[9px] font-bold text-slate-400">Pagar desde: {format(new Date(doc.fechaAutorizacionPago), 'dd/MM/yyyy')}</span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Pendiente</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {doc.anulado ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase">Anulado</span>
                          </div>
                        ) : doc.asientoId ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">Contabilizado</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Asiento {doc.asiento?.numero}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Falta Asiento</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {doc.pagado ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">Pagado</span>
                            </div>
                            {doc.asientoPago && (
                              <span className="text-[9px] font-bold text-slate-400">Asiento Pago {doc.asientoPago.numero}</span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-400 rounded-full border border-slate-200">
                            <Lock className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Impago</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {!doc.anulado && (
                            <>
                              {!doc.autorizado && (
                                <button
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Autorizar para Pago"
                                  onClick={() => {
                                    setDocToAuth(doc);
                                    setIsAuthModalOpen(true);
                                  }}
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </button>
                              )}
                              {doc.autorizado && !doc.pagado && (
                                <button
                                  title="Pagar"
                                  onClick={() => {
                                    if (!isContabilidadEnabled) {
                                      toast.error("El módulo contable está desactivado. No se pueden procesar pagos.");
                                      return;
                                    }
                                    setDocToPay(doc);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className={`p-2 rounded-xl transition-all ${!isContabilidadEnabled ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Editar"
                                onClick={() => {
                                  setSelectedDocForEdit(doc);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                                <button
                                  className={`p-2 rounded-xl transition-all ${!isContabilidadEnabled && doc.asientoId ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                  title="Anular"
                                  onClick={() => {
                                    if (!isContabilidadEnabled && doc.asientoId) {
                                      toast.error("El módulo contable está desactivado. No se puede anular un documento con asiento.");
                                      return;
                                    }
                                    handleAnular(doc.id);
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                            </>
                          )}
                          {doc.asientoId && (
                            <button
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Ver Asiento"
                              onClick={() => window.open(`/asientos?search=${doc.asiento?.numero}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                          {doc.asientoPagoId && (
                            <button
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Ver Asiento de Pago"
                              onClick={() => window.open(`/asientos?search=${doc.asientoPago?.numero}`, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 text-emerald-600" />
                            </button>
                          )}
                          {!doc.asientoId && (
                            <button
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Eliminar Físicamente"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 border-b-2 hover:border-slate-300 transition-all"
                  value={fechaAuth}
                  onChange={(e) => setFechaAuth(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 font-medium italic mt-1.5 px-1">
                  A partir de esta fecha, Tesorería podrá procesar el pago.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleAutorizar}
                  className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" />
                  AUTORIZAR AHORA
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
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</span>
                  <span className="text-xs font-black text-emerald-600 uppercase mt-1">Autorizado para Pago</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuenta Pagadora</label>
                  <button
                    type="button"
                    onClick={() => setIsAccountSelectorOpen(true)}
                    className={`w-full text-left bg-slate-50 border-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all flex items-center justify-between group ${selectedPayingAccount ? "text-slate-900 border-indigo-100 bg-white" : "text-slate-400 border-transparent hover:border-indigo-100"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Search className={`w-4 h-4 ${selectedPayingAccount ? "text-indigo-500" : "text-slate-300"}`} />
                      <span>{selectedPayingAccount ? selectedPayingAccount.nombre : "Seleccionar cuenta (Caja/Banco)..."}</span>
                    </div>
                    {selectedPayingAccount && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md">{selectedPayingAccount.codigo}</span>
                    )}
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
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-4 text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handlePagar}
                  disabled={!selectedPayingAccount}
                  className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:grayscale text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  CONFIRMAR PAGO
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
