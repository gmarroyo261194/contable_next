"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  RefreshCw,
  Filter,
  AlertCircle,
  FileUp,
  Send,
  X,
} from "lucide-react";
import RegistrarPagoModal from "@/components/asientos/RegistrarPagoModal";
import { SyncFacturasModal } from "@/components/asientos/SyncFacturasModal";
import ImportarFacturaPDFModal from "@/components/asientos/ImportarFacturaPDFModal";
import EditarFacturaModal from "@/components/asientos/EditarFacturaModal";
import EmitirFacturaAfipModal from "@/components/asientos/EmitirFacturaAfipModal";
import { getDocumentosClientes, deleteDocumentoCliente } from "@/lib/actions/sync-facturas-actions";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { getEntidades } from "@/lib/actions/entidad-actions";
import { getServicios } from "@/lib/actions/servicio-actions";
import { getModulos } from "@/lib/actions/module-actions";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { generatePaymentLinkAction, sendPaymentEmailAction, downloadInvoicePdfAction } from "@/lib/actions/payment-actions";
import { DataGrid } from "@/components/ui/DataGrid";
import { docCliGridConfig } from "@/lib/configs/doccli.config";

export default function DocumentosClientesPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [orderBy, setOrderBy] = useState("fecha");
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>("desc");
  const [filterEstado, setFilterEstado] = useState<'todos' | 'pendientes' | 'contabilizados'>("todos");
  const [filterEntidadId, setFilterEntidadId] = useState<number | undefined>();
  const [filterServicioId, setFilterServicioId] = useState<number | undefined>();
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>("");
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>("");
  const [entidades, setEntidades] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAfipModalOpen, setIsAfipModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocForItems, setSelectedDocForItems] = useState<any | null>(null);
  const [selectedDocForPago, setSelectedDocForPago] = useState<any | null>(null);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<any | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState<number | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState<number | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<number | null>(null);
  const { data: session } = useSession();
  const { ejercicioId: storeEjercicioId } = useAppStore();

  const ejercicioId = storeEjercicioId || (session?.user as any)?.ejercicioId;
  const isContabilidadEnabled = activeModules.includes("CONTABILIDAD");

  const loadDocumentos = useCallback(async () => {
    if (!ejercicioId) {
      setDocumentos([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getDocumentosClientes({ 
        ejercicioId, 
        page, 
        pageSize, 
        search: searchTerm,
        orderBy,
        orderDir,
        estado: filterEstado,
        entidadId: filterEntidadId,
        servicioId: filterServicioId,
        fechaDesde: filterFechaDesde,
        fechaHasta: filterFechaHasta
      });
      setDocumentos(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error("Error loading documentos:", error);
    } finally {
      setLoading(false);
    }
  }, [ejercicioId, page, pageSize, searchTerm, orderBy, orderDir, filterEstado, filterEntidadId, filterServicioId, filterFechaDesde, filterFechaHasta]);

  const loadCuentas = useCallback(async () => {
    if (!ejercicioId) return;
    try {
      const data = await getCuentas();
      setCuentas(data);
    } catch (error) {
      console.error("Error loading cuentas:", error);
    }
  }, [ejercicioId]);

  const loadFilterData = useCallback(async () => {
    const empresaId = (session?.user as any)?.empresaId;
    if (!empresaId) return;

    try {
      const entData = await getEntidades();
      setEntidades(entData);
      const servData = await getServicios(Number(empresaId));
      setServicios(servData);
    } catch (error) {
      console.error("Error loading filter data:", error);
    }
  }, [session?.user?.empresaId]);

  useEffect(() => {
    loadDocumentos();
    loadCuentas();
    loadFilterData();
    getModulos().then(mods => setActiveModules(mods.filter(m => m.activo).map(m => m.codigo)));
  }, [loadDocumentos, loadCuentas, loadFilterData]);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta factura físicamente? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      const res = await deleteDocumentoCliente(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Factura eliminada");
        loadDocumentos();
      }
    } catch (error) {
      toast.error("Error al intentar eliminar la factura.");
    }
  };

  const handleGenerateLink = async (id: number) => {
    setIsGeneratingLink(id);
    try {
      const res = await generatePaymentLinkAction(id);
      if (res.success) {
        toast.success("Link de pago generado exitosamente.");
        loadDocumentos();
      } else {
        toast.error("Error: " + res.error);
      }
    } catch (error) {
      toast.error("Error al generar el link.");
    } finally {
      setIsGeneratingLink(null);
    }
  };

  const handleSendEmail = async (id: number) => {
    setIsSendingEmail(id);
    try {
      const res = await sendPaymentEmailAction(id);
      if (res.success) {
        toast.success("Email enviado exitosamente.");
      } else {
        toast.error("Error: " + res.error);
      }
    } catch (error) {
      toast.error("Error al enviar el email.");
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleDownloadPdf = async (id: number) => {
    setIsDownloadingPdf(id);
    try {
      const result = await downloadInvoicePdfAction(id);
      if (result.success && result.base64 && result.filename) {
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        toast.error(result.error || "No se pudo generar el PDF");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al descargar PDF");
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const config = docCliGridConfig({
    onVerItems: setSelectedDocForItems,
    onEditar: (doc) => { setSelectedDocForEdit(doc); setIsEditModalOpen(true); },
    onRegistrarPago: (doc) => {
      if (!isContabilidadEnabled) {
        toast.error("El módulo contable está desactivado.");
        return;
      }
      setSelectedDocForPago(doc);
      setIsPagoModalOpen(true);
    },
    onGenerarLink: handleGenerateLink,
    onEnviarEmail: handleSendEmail,
    onDescargarPdf: handleDownloadPdf,
    onEliminar: handleDelete
  }, {
    isContabilidadEnabled,
    isGeneratingLink,
    isSendingEmail,
    isDownloadingPdf
  });

  const fmtImporte = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="w-full mx-auto space-y-4">
        {!isContabilidadEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-center gap-3 text-amber-800 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight">Módulo Contable Desactivado</p>
              <p className="text-xs font-medium opacity-80">Las funciones de registro de cobros y generación de asientos están suspendidas.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facturas Emitidas</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="group flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl hover:bg-indigo-50 border border-indigo-100 transition-all shadow-md active:scale-95 font-bold text-sm"
            >
              <FileUp className="w-5 h-5 text-indigo-500" />
              Importar PDF
            </button>

            <button
              onClick={() => setIsAfipModalOpen(true)}
              className="group flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95 font-bold text-sm"
            >
              <Send className="w-5 h-5 text-white" />
              Nueva Factura AFIP
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 font-bold text-sm"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Sincronizar Facturas
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex justify-end">
            <div className="relative">
              <button 
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all text-sm ${
                  isFilterPanelOpen || filterEstado !== 'todos' || filterEntidadId || filterServicioId || filterFechaDesde || filterFechaHasta
                  ? 'bg-indigo-50 text-indigo-600 shadow-inner' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtros
                {(filterEstado !== 'todos' || filterEntidadId || filterServicioId || filterFechaDesde || filterFechaHasta) && (
                  <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </button>

              {isFilterPanelOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Filtros Avanzados</h3>
                    <button 
                      onClick={() => {
                        setFilterEstado('todos');
                        setFilterEntidadId(undefined);
                        setFilterServicioId(undefined);
                        setFilterFechaDesde("");
                        setFilterFechaHasta("");
                        setPage(1);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Limpiar Todo
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Estado</label>
                      <select 
                        value={filterEstado}
                        onChange={(e) => {
                          setFilterEstado(e.target.value as any);
                          setPage(1);
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="todos">Todos los estados</option>
                        <option value="pendientes">Pendientes de Asiento</option>
                        <option value="contabilizados">Contabilizados</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Cliente</label>
                      <select 
                        value={filterEntidadId || ""}
                        onChange={(e) => {
                          setFilterEntidadId(e.target.value ? Number(e.target.value) : undefined);
                          setPage(1);
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Todos los clientes</option>
                        {entidades.map(ent => (
                          <option key={ent.id} value={ent.id}>{ent.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Servicio</label>
                      <select 
                        value={filterServicioId || ""}
                        onChange={(e) => {
                          setFilterServicioId(e.target.value ? Number(e.target.value) : undefined);
                          setPage(1);
                        }}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="">Todos los servicios</option>
                        {servicios.map(serv => (
                          <option key={serv.id} value={serv.id}>{serv.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Desde</label>
                        <input 
                          type="date"
                          value={filterFechaDesde}
                          onChange={(e) => {
                            setFilterFechaDesde(e.target.value);
                            setPage(1);
                          }}
                          className="w-full bg-slate-50 border-none rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Hasta</label>
                        <input 
                          type="date"
                          value={filterFechaHasta}
                          onChange={(e) => {
                            setFilterFechaHasta(e.target.value);
                            setPage(1);
                          }}
                          className="w-full bg-slate-50 border-none rounded-xl px-2 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="w-full mt-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Cerrar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>

          <DataGrid 
            config={config}
            data={documentos}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por cliente, número o tipo..."
          />
        </div>
      </div>

      <ImportarFacturaPDFModal
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          loadDocumentos();
        }}
        empresaId={Number(session?.user?.empresaId)}
      />

      <SyncFacturasModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          loadDocumentos();
        }}
      />

      {/* Modal de Detalles de Ítems */}
      {selectedDocForItems && (
        <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">Detalle de Factura</h3>
                <p className="text-xs text-slate-500 font-bold uppercase">{selectedDocForItems.numero} - {selectedDocForItems.entidad?.nombre}</p>
              </div>
              <button
                onClick={() => setSelectedDocForItems(null)}
                className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white border-b border-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unitario</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedDocForItems.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">{item.descripcion}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600 text-center">{Number(item.cantidad)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">{fmtImporte(Number(item.precioUnitario))}</td>
                      <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">{fmtImporte(Number(item.importeTotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/50 font-black">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-slate-500 uppercase text-xs tracking-widest">Total Comprobante</td>
                    <td className="px-6 py-4 text-right text-lg text-indigo-600">{fmtImporte(Number(selectedDocForItems.montoTotal))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDocForItems(null)}
                className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <RegistrarPagoModal
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          setSelectedDocForPago(null);
        }}
        documento={selectedDocForPago}
        onSuccess={loadDocumentos}
        cuentas={cuentas}
      />

      <EditarFacturaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDocForEdit(null);
        }}
        documento={selectedDocForEdit}
        onSuccess={loadDocumentos}
        empresaId={Number(session?.user?.empresaId)}
      />

      <EmitirFacturaAfipModal
        isOpen={isAfipModalOpen}
        onClose={() => setIsAfipModalOpen(false)}
        onSuccess={loadDocumentos}
      />
    </div>
  );
}
