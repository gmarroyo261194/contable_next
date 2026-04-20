"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  X,
  Database,
  CheckSquare,
  Square,
  Wifi,
  WifiOff,
  Clock,
  FileText,
  Search,
} from "lucide-react";
import { getFacturasExternasPendientes, syncFacturasSeleccionadas, FacturaExterna } from "@/lib/actions/sync-facturas-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { getTipoComprobanteNombre } from "@/lib/utils/voucher-utils";
import { useAppStore } from "@/store/useAppStore";

interface SyncFacturasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LAST_SYNC_KEY = "lastSyncFacturas";

export function SyncFacturasModal({ isOpen, onClose }: SyncFacturasModalProps) {
  const [facturasExternas, setFacturasExternas] = useState<FacturaExterna[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session } = useSession();
  const { ejercicioId: storeEjercicioId } = useAppStore();

  const ejercicioId = storeEjercicioId || (session?.user as any)?.ejercicioId;

  const loadFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await getFacturasExternasPendientes();
      setFacturasExternas(docs);
      setSelected(new Set(docs.map((f) => f.id)));
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con la base de datos externa.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFacturas();
      const ts = localStorage.getItem(LAST_SYNC_KEY);
      setLastSync(ts);
    }
  }, [isOpen, loadFacturas]);

  const toggleFactura = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFacturas = facturasExternas.filter(f =>
    f.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.servicioNombre || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAll = () => {
    const allFilteredVisible = filteredFacturas.every(f => selected.has(f.id));

    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredVisible) {
        // Deselect all that are currently visible in filtered list
        filteredFacturas.forEach(f => next.delete(f.id));
      } else {
        // Select all that are currently visible in filtered list
        filteredFacturas.forEach(f => next.add(f.id));
      }
      return next;
    });
  };

  const handleSync = async () => {
    if (selected.size === 0) {
      toast.warning("Debes seleccionar al menos un comprobante para sincronizar.");
      return;
    }

    setSyncing(true);
    try {
      if (!ejercicioId) {
        toast.error("No se detectó un ejercicio activo. Por favor, seleccione uno o reinicie sesión.");
        setSyncing(false);
        return;
      }
      const seleccionadas = facturasExternas.filter(f => selected.has(f.id));
      const result = await syncFacturasSeleccionadas(seleccionadas, ejercicioId);

      if (result.success) {
        const ts = new Date().toLocaleString("es-AR");
        localStorage.setItem(LAST_SYNC_KEY, ts);
        setLastSync(ts);
        toast.success(`Sincronización exitosa: ${result.syncedCount} comprobantes importados.`);
        onClose();
      } else {
        toast.error(result.error || "Error durante la sincronización.");
      }
    } catch (err: any) {
      toast.error("Error inesperado durante la sincronización.");
    } finally {
      setSyncing(false);
    }
  };

  const allSelected = facturasExternas.length > 0 && selected.size === facturasExternas.length;
  const someSelected = selected.size > 0 && selected.size < facturasExternas.length;
  const totalImporteSeleccionado = facturasExternas
    .filter((f) => selected.has(f.id))
    .reduce((acc, f) => acc + f.importeTotal, 0);

  const fmtImporte = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-100"
          />

          <div className="fixed inset-0 z-110 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl overflow-hidden pointer-events-auto border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />

              <div className="p-6 pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-tight">
                        Sincronizar Comprobantes
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Solo facturas pagadas en PagosFundacion que aún no están registradas.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-semibold">
                    <Wifi className="w-3.5 h-3.5" />
                    PagosFundacion (Remoto)
                  </div>
                  {lastSync && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Último sync: {lastSync}
                    </div>
                  )}
                  <button
                    onClick={loadFacturas}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors ml-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Recargar
                  </button>
                </div>

                {/* Search Filter */}
                <div className="mt-4 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Filtrar por cliente o servicio..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-500 font-bold">Consultando base externa...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="p-3 bg-red-50 rounded-2xl">
                      <WifiOff className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-red-600">Error de conexión</p>
                    <p className="text-xs text-slate-400 text-center max-w-xs">{error}</p>
                    <button onClick={loadFacturas} className="text-xs text-blue-600 hover:underline">
                      Intentar nuevamente
                    </button>
                  </div>
                ) : filteredFacturas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center p-6">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No hay coincidencias</p>
                    <p className="text-xs text-slate-500">Prueba con otro cliente o nombre de servicio.</p>
                  </div>
                ) : (
                  <>
                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 sticky top-0 z-10 backdrop-blur-sm">
                      <button onClick={toggleAll} className="flex items-center gap-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
                        {filteredFacturas.length > 0 && filteredFacturas.every(f => selected.has(f.id)) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : filteredFacturas.some(f => selected.has(f.id)) ? (
                          <div className="w-5 h-5 rounded border-2 border-blue-400 bg-blue-100 flex items-center justify-center">
                            <div className="w-2.5 h-0.5 bg-blue-600 rounded" />
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                        {filteredFacturas.every(f => selected.has(f.id)) ? "Deseleccionar visibles" : "Seleccionar visibles"}
                      </button>
                      <span className="ml-auto text-xs text-slate-400 font-medium">
                        {filteredFacturas.length} de {facturasExternas.length} encontrados
                      </span>
                    </div>

                    <div className="divide-y divide-slate-50">
                      {filteredFacturas.map((f) => {
                        const isChecked = selected.has(f.id);

                        return (
                          <label
                            key={f.id}
                            className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${isChecked ? "bg-blue-50/30" : "hover:bg-slate-50"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFactura(f.id)}
                              className="sr-only"
                            />
                            <div className="flex-shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                              <div className="col-span-1">
                                <span className="text-xs text-slate-400 font-bold uppercase block">Fecha</span>
                                <span className="text-sm font-semibold text-slate-700 text-[10px] md:text-sm">
                                  {format(new Date(f.fecha), 'dd/MM/yy')}
                                </span>
                              </div>
                              <div className="col-span-1 md:col-span-1">
                                <span className="text-xs text-slate-400 font-bold uppercase block">Comprobante</span>
                                <span className="text-[11px] font-black text-indigo-600 block">
                                  {getTipoComprobanteNombre(f.tipo)}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {`${String(f.puntoVenta).padStart(4, '0')}-${String(f.numero).padStart(8, '0')}`}
                                </span>
                              </div>
                              <div className="col-span-1 md:col-span-1">
                                <span className="text-xs text-slate-400 font-bold uppercase block">Cliente</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-800 truncate" title={f.clienteNombre}>
                                    {f.clienteNombre}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono italic">{f.clienteDoc}</span>
                              </div>
                              <div className="col-span-1 md:col-span-1">
                                <span className="text-xs text-slate-400 font-bold uppercase block">Servicio</span>
                                <span className="text-xs font-bold text-blue-600 truncate block">
                                  {f.servicioNombre || "Gral"}
                                </span>
                              </div>
                              <div className="col-span-1 text-right">
                                <span className="text-xs text-slate-400 font-bold uppercase block">Importe</span>
                                <span className="text-sm font-black text-slate-900">
                                  {fmtImporte(f.importeTotal)}
                                </span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {!loading && !error && facturasExternas.length > 0 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                  {selected.size > 0 && (
                    <div className="mb-4 flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-blue-900">
                            {selected.size} Factura{selected.size !== 1 ? "s" : ""} seleccionada{selected.size !== 1 ? "s" : ""}
                          </p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Total a sincronizar: {fmtImporte(totalImporteSeleccionado)}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-400 font-medium hidden md:block italic">
                        Se crearán los clientes automáticamente
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={syncing}
                      className="flex-1 px-5 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSync}
                      disabled={syncing || selected.size === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          IMPORTAR {selected.size > 0 ? `(${selected.size})` : ""}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
