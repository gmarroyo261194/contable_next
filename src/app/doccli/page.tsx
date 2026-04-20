"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  FileUp,
  Trash2,
} from "lucide-react";
import { SyncFacturasModal } from "@/components/asientos/SyncFacturasModal";
import ImportarFacturaPDFModal from "@/components/asientos/ImportarFacturaPDFModal";
import { getDocumentosClientes, deleteDocumentoCliente } from "@/lib/actions/sync-facturas-actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getTipoComprobanteNombre } from "@/lib/utils/voucher-utils";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function DocumentosClientesPage() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocForItems, setSelectedDocForItems] = useState<any | null>(null);
  const { data: session } = useSession();
  const { ejercicioId: storeEjercicioId } = useAppStore();

  const ejercicioId = storeEjercicioId || (session?.user as any)?.ejercicioId;

  const loadDocumentos = useCallback(async () => {
    if (!ejercicioId) {
      setDocumentos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getDocumentosClientes(ejercicioId);
      setDocumentos(data);
    } catch (error) {
      console.error("Error loading documentos:", error);
    } finally {
      setLoading(false);
    }
  }, [ejercicioId]);

  useEffect(() => {
    loadDocumentos();
  }, [loadDocumentos]);

  const filteredDocs = documentos.filter(doc =>
    doc.entidad?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.numero?.includes(searchTerm) ||
    doc.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta factura físicamente? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await deleteDocumentoCliente(id);
      if (res.error) {
        alert(res.error);
      } else {
        loadDocumentos();
      }
    } catch (error) {
      alert("Error al intentar eliminar la factura.");
    }
  };

  const fmtImporte = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <>
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8">
      <div className="w-full mx-auto space-y-4">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
              <FileText className="w-4 h-4" />
              Gestión de Ventas
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Facturas Emitidas</h1>
            <p className="text-slate-500 font-medium">
              Administra y sincroniza comprobantes externos para su contabilización.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="group flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl
                hover:bg-indigo-50 border border-indigo-100 transition-all shadow-md active:scale-95 font-bold"
            >
              <FileUp className="w-5 h-5 text-indigo-500" />
              Importar PDF
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl
                hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 font-bold"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Sincronizar Facturas
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all">
          <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, número o tipo..."
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-slate-700 placeholder:text-slate-400
                  focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
              />
            </div>

            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-slate-500 font-bold">Cargando documentos...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-center max-w-sm mx-auto space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2 text-slate-300">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Sin resultados</h3>
                <p className="text-slate-500 font-medium">No se encontraron documentos sincronizados que coincidan con la búsqueda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Cobro</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Servicio</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Comprobante</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="text-slate-700 font-bold">{format(new Date(doc.fecha), 'dd/MM/yyyy')}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        {doc.fechaPago ? (
                          <div className="text-indigo-600 font-bold">{format(new Date(doc.fechaPago), 'dd/MM/yyyy')}</div>
                        ) : (
                          <div className="text-slate-300 text-xs italic">Pendiente</div>
                        )}
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 truncate max-w-[200px]">{doc.entidad?.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{doc.entidad?.cuit || doc.entidad?.nroDoc}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                          <div className="text-sm font-bold text-slate-700 italic truncate max-w-[150px]">
                            {doc.servicio?.nombre || 'General'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="font-black text-slate-700">{doc.numero}</div>
                        <div className="text-[10px] text-indigo-500 font-black uppercase">
                          {getTipoComprobanteNombre(doc.tipo)}
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-right">
                        <div className="text-lg font-black text-slate-900 tracking-tight">
                          {fmtImporte(doc.montoTotal)}
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-center">
                        {doc.asientoId ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">Asiento {doc.asiento?.numero}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                            <Clock className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">Pendiente</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Ver Items"
                            onClick={() => setSelectedDocForItems(doc)}
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          {!doc.asientoId && (
                            <>
                              <button
                                className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all"
                                onClick={() => {/* Próximo paso: Implementar contabilización */ }}
                              >
                                Contabilizar
                              </button>
                              <button
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar Factura"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
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
                  {(!selectedDocForItems.items || selectedDocForItems.items.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No hay detalles registrados para este comprobante.</td>
                    </tr>
                  )}
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
    </div>
    </>
  );
}
