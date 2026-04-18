"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  X,
  Database,
  Check,
  CheckSquare,
  Square,
  Wifi,
  WifiOff,
  Clock,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import { getRubrosExternos, syncRubrosSeleccionados, RubroExterno } from "@/lib/actions/sync-rubros-actions";
import { toast } from "sonner";

interface SyncRubrosModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Nombres de rubros que ya existen en ContableNext (para marcarlos como sincronizados) */
  rubrosLocales: string[];
}

const LAST_SYNC_KEY = "lastSyncRubros";

/**
 * Modal de sincronización de Rubros y Servicios desde PagosFundacion.
 * Permite seleccionar los rubros activos a importar, muestra cuáles ya
 * están sincronizados y registra el timestamp del último sync en localStorage.
 *
 * @param {boolean} isOpen - Controla visibilidad del modal.
 * @param {() => void} onClose - Callback para cerrar el modal.
 * @param {string[]} rubrosLocales - Nombres de rubros ya presentes localmente.
 */
export function SyncRubrosModal({ isOpen, onClose, rubrosLocales }: SyncRubrosModalProps) {
  const [rubrosExternos, setRubrosExternos] = useState<RubroExterno[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Carga los rubros externos al abrir el modal
  const loadRubros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rubros = await getRubrosExternos();
      setRubrosExternos(rubros);
      // Pre-seleccionar los que NO están sincronizados aún
      const newOnes = rubros.filter((r) => !rubrosLocales.includes(r.nombre));
      setSelected(new Set(newOnes.map((r) => r.id)));
    } catch (err: any) {
      setError(err.message || "No se pudo conectar con PagosFundacion.");
    } finally {
      setLoading(false);
    }
  }, [rubrosLocales]);

  useEffect(() => {
    if (isOpen) {
      loadRubros();
      const ts = localStorage.getItem(LAST_SYNC_KEY);
      setLastSync(ts);
    }
  }, [isOpen, loadRubros]);

  const toggleRubro = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rubrosExternos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rubrosExternos.map((r) => r.id)));
    }
  };

  const handleSync = async () => {
    if (selected.size === 0) {
      toast.warning("Debes seleccionar al menos un rubro para sincronizar.");
      return;
    }

    setSyncing(true);
    try {
      const result = await syncRubrosSeleccionados(Array.from(selected));

      if (result.success) {
        const ts = new Date().toLocaleString("es-AR");
        localStorage.setItem(LAST_SYNC_KEY, ts);
        setLastSync(ts);
        toast.success(
          `Sincronización exitosa: ${result.rubrosSync} rubro${result.rubrosSync !== 1 ? "s" : ""} y ${result.serviciosSync} servicio${result.serviciosSync !== 1 ? "s" : ""} importados.`
        );
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

  const allSelected = rubrosExternos.length > 0 && selected.size === rubrosExternos.length;
  const someSelected = selected.size > 0 && selected.size < rubrosExternos.length;
  const totalServiciosSeleccionados = rubrosExternos
    .filter((r) => selected.has(r.id))
    .reduce((acc, r) => acc + r.totalServicios, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden pointer-events-auto border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header accent */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-tight">
                        Sincronizar desde PagosFundacion
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Solo rubros y servicios activos en el origen.
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

                {/* Info bar */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-semibold">
                    <Wifi className="w-3.5 h-3.5" />
                    192.168.16.35 / PagosFundacion
                  </div>
                  {lastSync && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Último sync: {lastSync}
                    </div>
                  )}
                  <button
                    onClick={loadRubros}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors ml-auto"
                    title="Recargar lista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Recargar
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-slate-500">Consultando PagosFundacion...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="p-3 bg-red-50 rounded-2xl">
                      <WifiOff className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-red-600">Error de conexión</p>
                    <p className="text-xs text-slate-400 text-center max-w-xs">{error}</p>
                    <button onClick={loadRubros} className="text-xs text-blue-600 hover:underline">
                      Intentar nuevamente
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Select all row */}
                    <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <button onClick={toggleAll} className="flex items-center gap-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors">
                        {allSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : someSelected ? (
                          <div className="w-5 h-5 rounded border-2 border-blue-400 bg-blue-100 flex items-center justify-center">
                            <div className="w-2.5 h-0.5 bg-blue-600 rounded" />
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-slate-400" />
                        )}
                        {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
                      </button>
                      <span className="ml-auto text-xs text-slate-400">
                        {rubrosExternos.length} rubros activos en origen
                      </span>
                    </div>

                    {/* Rubros list */}
                    <div className="divide-y divide-slate-50">
                      {rubrosExternos.map((rubro) => {
                        const isLocal = rubrosLocales.includes(rubro.nombre);
                        const isChecked = selected.has(rubro.id);

                        return (
                          <label
                            key={rubro.id}
                            className={`flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-colors ${
                              isChecked ? "bg-blue-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleRubro(rubro.id)}
                              className="sr-only"
                            />
                            <div className="flex-shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-800 truncate">
                                  {rubro.nombre}
                                </span>
                                {isLocal && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-black uppercase tracking-wider flex-shrink-0">
                                    <Check className="w-2.5 h-2.5" />
                                    Sync
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {rubro.totalServicios > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                  <Wrench className="w-3 h-3" />
                                  {rubro.totalServicios} servicios
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">sin servicios</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!loading && !error && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
                  {/* Resumen selección */}
                  {selected.size > 0 && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                      <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Se sincronizarán <strong>{selected.size} rubro{selected.size !== 1 ? "s" : ""}</strong>{" "}
                        con <strong>{totalServiciosSeleccionados} servicio{totalServiciosSeleccionados !== 1 ? "s" : ""}</strong>{" "}
                        activos. Los campos locales (departamento, % retención, cuentas) no serán modificados.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={syncing}
                      className="flex-1 px-5 py-3 rounded-2xl text-sm font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSync}
                      disabled={syncing || selected.size === 0}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Sincronizar {selected.size > 0 ? `(${selected.size})` : ""}
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
