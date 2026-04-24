"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  Send, 
  User, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Hash,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { emitirComprobanteAFIP, getUltimoNroAFIP } from "@/actions/afip-actions";
import { getEntidades } from "@/lib/actions/entidad-actions";
import { getRubros } from "@/lib/actions/rubro-actions";
import { getServicios } from "@/lib/actions/servicio-actions";
import { TIPO_COMPROBANTE, CONCEPTO, TIPO_COMPROBANTE_LABEL } from "@/lib/afip/voucherTypes";
import { useAppStore } from "@/store/useAppStore";
import { useSession } from "next-auth/react";

interface EmitirFacturaAfipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Item {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export default function EmitirFacturaAfipModal({ isOpen, onClose, onSuccess }: EmitirFacturaAfipModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingLast, setFetchingLast] = useState(false);
  const [entidades, setEntidades] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntityResults, setShowEntityResults] = useState(false);
  
  // Form State
  const [selectedEntidad, setSelectedEntidad] = useState<any | null>(null);
  const [ptoVenta, setPtoVenta] = useState<number>(1);
  const [cbteTipo, setCbteTipo] = useState<number>(11); // Default Factura C
  const [concepto, setConcepto] = useState<number>(1); // Default Productos
  const [ultimoNro, setUltimoNro] = useState<number | null>(null);

  // Rubros & Servicios
  const [rubros, setRubros] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [selectedRubroId, setSelectedRubroId] = useState<number | null>(null);
  const [selectedServicioId, setSelectedServicioId] = useState<number | null>(null);
  
  // Dates for Services
  const [fechaServicioDesde, setFechaServicioDesde] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaServicioHasta, setFechaServicioHasta] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaVtoPago, setFechaVtoPago] = useState<string>(new Date().toISOString().split('T')[0]);

  // Items State
  const [items, setItems] = useState<Item[]>([
    { id: Math.random().toString(36).substr(2, 9), descripcion: "", cantidad: 1, precioUnitario: 0 }
  ]);

  const { ejercicioId } = useAppStore();
  const { data: session } = useSession();
  const empresaId = Number(session?.user?.empresaId);

  useEffect(() => {
    if (isOpen) {
      getEntidades().then(setEntidades);
      getRubros().then(setRubros);
      if (empresaId) getServicios(empresaId).then(setServicios);
    }
  }, [isOpen, empresaId]);

  // Consultar último número al cambiar tipo o PV
  useEffect(() => {
    if (isOpen && ptoVenta && cbteTipo) {
      setFetchingLast(true);
      getUltimoNroAFIP(ptoVenta, cbteTipo)
        .then(res => {
          if (res.success && res.data) setUltimoNro(res.data.numeroComprobante);
        })
        .finally(() => setFetchingLast(false));
    }
  }, [isOpen, ptoVenta, cbteTipo]);

  const filteredEntidades = entidades.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.cuit || "").includes(searchTerm) ||
    (e.nroDoc || "").includes(searchTerm)
  ).slice(0, 5);

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), descripcion: "", cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(it => it.id !== id));
    }
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(items.map(it => it.id === id ? { ...it, ...updates } : it));
  };

  const total = items.reduce((sum, it) => sum + (it.cantidad * it.precioUnitario), 0);

  const handleSubmit = async () => {
    if (!selectedEntidad) {
      toast.error("Debe seleccionar un cliente.");
      return;
    }
    if (items.some(it => !it.descripcion || it.precioUnitario <= 0)) {
      toast.error("Complete todos los ítems con descripción e importe.");
      return;
    }
    if (!ejercicioId || !empresaId) {
      toast.error("Falta información de empresa o ejercicio.");
      return;
    }

    setLoading(true);
    try {
      const res = await emitirComprobanteAFIP({
        empresaId,
        ejercicioId,
        entidadId: selectedEntidad.id,
        ptoVenta,
        cbteTipo,
        concepto,
        items: items.map(it => ({
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario
        })),
        fechaServicioDesde: concepto !== 1 ? new Date(fechaServicioDesde) : undefined,
        fechaServicioHasta: concepto !== 1 ? new Date(fechaServicioHasta) : undefined,
        fechaVtoPago: concepto !== 1 ? new Date(fechaVtoPago) : undefined,
        rubroId: selectedRubroId || undefined,
        servicioId: selectedServicioId || undefined
      });

      if (res.success) {
        toast.success("Comprobante emitido y autorizado correctamente.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Error al emitir comprobante.");
      }
    } catch (error) {
      toast.error("Error inesperado en la comunicación con AFIP.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Nueva Factura Electrónica</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Emisión Directa AFIP • WSFEv1</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* Step 1: Client and Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Client and Main Voucher Settings */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User className="w-3 h-3" /> Cliente / Receptor
                  </label>
                  <div className="relative">
                    {selectedEntidad ? (
                      <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                        <div>
                          <p className="text-sm font-black text-indigo-900">{selectedEntidad.nombre}</p>
                          <p className="text-[10px] text-indigo-600 font-mono">{selectedEntidad.cuit || selectedEntidad.nroDoc || "Sin Documento"}</p>
                        </div>
                        <button 
                          onClick={() => { setSelectedEntidad(null); setSearchTerm(""); }}
                          className="p-1.5 hover:bg-white rounded-lg text-indigo-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400 font-medium"
                            placeholder="Buscar por nombre, CUIT o DNI..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setShowEntityResults(true); }}
                            onFocus={() => setShowEntityResults(true)}
                          />
                        </div>
                        {showEntityResults && searchTerm.length > 0 && (
                          <div className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredEntidades.length > 0 ? (
                              filteredEntidades.map(ent => (
                                <button
                                  key={ent.id}
                                  onClick={() => { setSelectedEntidad(ent); setShowEntityResults(false); }}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition-colors border-b last:border-none border-slate-50"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-700">{ent.nombre}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{ent.cuit || ent.nroDoc}</p>
                                  </div>
                                  <Plus className="w-4 h-4 text-slate-300" />
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-slate-400 text-xs italic">No se encontraron resultados</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Tipo de Comprobante
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                        value={cbteTipo}
                        onChange={(e) => setCbteTipo(Number(e.target.value))}
                      >
                        <option value={11}>Factura C</option>
                        <option value={12}>Nota de Débito C</option>
                        <option value={13}>Nota de Crédito C</option>
                        <option value={19}>Factura E (Exportación)</option>
                        <option value={20}>Nota de Débito E</option>
                        <option value={21}>Nota de Crédito E</option>
                        <option value={211}>Factura de Crédito Electrónica MiPyME C</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <CreditCard className="w-3 h-3" /> Concepto
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 h-[46px]">
                      <button
                        onClick={() => setConcepto(1)}
                        className={`flex-1 text-[11px] font-black uppercase rounded-xl transition-all ${concepto === 1 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Productos
                      </button>
                      <button
                        onClick={() => setConcepto(2)}
                        className={`flex-1 text-[11px] font-black uppercase rounded-xl transition-all ${concepto === 2 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        Servicios
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: AFIP and Accounting Settings */}
              <div className="space-y-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PV</label>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                      value={ptoVenta}
                      onChange={(e) => setPtoVenta(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Próximo</label>
                    <div className="w-full h-[42px] bg-slate-100 border border-slate-200 rounded-xl px-4 text-sm font-black text-slate-500 flex items-center justify-center">
                      {fetchingLast ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" /> : (ultimoNro !== null ? (ultimoNro + 1) : "---")}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Hash className="w-3 h-3" /> Rubro Contable
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                        value={selectedRubroId || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedRubroId(val);
                          setSelectedServicioId(null);
                        }}
                      >
                        <option value="">Seleccionar...</option>
                        {rubros.map(r => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calculator className="w-3 h-3" /> Servicio
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none disabled:opacity-50"
                        value={selectedServicioId || ""}
                        onChange={(e) => setSelectedServicioId(Number(e.target.value))}
                        disabled={!selectedRubroId}
                      >
                        <option value="">Seleccionar...</option>
                        {servicios
                          .filter(s => s.rubroId === selectedRubroId)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.nombre}</option>
                          ))
                        }
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional Service Dates */}
            {concepto === 2 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Servicio Desde</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    value={fechaServicioDesde}
                    onChange={(e) => setFechaServicioDesde(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Servicio Hasta</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    value={fechaServicioHasta}
                    onChange={(e) => setFechaServicioHasta(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Vencimiento Pago</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-indigo-100 rounded-xl px-4 py-2.5 text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    value={fechaVtoPago}
                    onChange={(e) => setFechaVtoPago(e.target.value)}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Items Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-3 h-3" /> Detalle del Comprobante
                </label>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full transition-all"
                >
                  <Plus className="w-3 h-3" /> Añadir Ítem
                </button>
              </div>

              <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Cant.</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">P. Unitario</th>
                      <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-40">Subtotal</th>
                      <th className="px-4 py-4 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {items.map((it) => (
                      <tr key={it.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <input
                            type="text"
                            placeholder="Descripción del ítem..."
                            className="w-full border-none p-0 focus:ring-0 text-sm font-semibold text-slate-700 bg-transparent placeholder:text-slate-200"
                            value={it.descripcion}
                            onChange={(e) => updateItem(it.id, { descripcion: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full border-none p-0 focus:ring-0 text-sm font-bold text-slate-700 text-center bg-transparent"
                            value={it.cantidad}
                            onChange={(e) => updateItem(it.id, { cantidad: Number(e.target.value) })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 font-bold text-slate-700 text-sm">
                            $
                            <input
                              type="number"
                              className="w-24 border-none p-0 focus:ring-0 text-sm font-bold text-slate-700 text-right bg-transparent"
                              value={it.precioUnitario}
                              onChange={(e) => updateItem(it.id, { precioUnitario: Number(e.target.value) })}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-black text-slate-900 whitespace-nowrap">
                            $ {(it.cantidad * it.precioUnitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(it.id)}
                            className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer / Totals */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end border-r border-slate-200 pr-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Comprobante</span>
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                  $ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="hidden md:flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Comunicación AFIP Segura
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Registro Automático
                </div>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 md:flex-none px-8 py-4 rounded-2xl text-sm font-black text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || total <= 0 || !selectedEntidad}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    EMITIR FACTURA
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
