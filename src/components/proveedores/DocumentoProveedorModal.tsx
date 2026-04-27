"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Calculator, 
  Save, 
  User, 
  FileText, 
  Calendar,
  Search,
  Hash,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getEntidades } from "@/lib/actions/entidad-actions";
import { getCuentas } from "@/lib/actions/asiento-actions";
import { upsertDocumentoProveedor } from "@/lib/actions/doc-prov-actions";
import { useSession } from "next-auth/react";
import { AccountSearchDialog } from "@/components/AccountSearchDialog";

interface DocumentoProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documento?: any; // Para edición
}

export default function DocumentoProveedorModal({ isOpen, onClose, onSuccess, documento }: DocumentoProveedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEntityResults, setShowEntityResults] = useState(false);
  const [isAccountSelectorOpen, setIsAccountSelectorOpen] = useState(false);
  const [accountSelectType, setAccountSelectType] = useState<"debe" | "haber">("debe");
  
  const { data: session } = useSession();

  // Form State
  const [formData, setFormData] = useState({
    tipo: "Factura",
    letra: "C",
    numero: "",
    fecha: new Date().toISOString().split('T')[0],
    vencimiento: "",
    cai: "",
    montoTotal: 0,
    iva: 0,
    retencion: 0,
    detalle: "",
    entidadId: null as number | null,
    cuentaDebeId: null as number | null,
    cuentaHaberId: null as number | null,
    leyendaDebe: "",
    leyendaHaber: "",
    generarAsiento: true
  });

  const [selectedEntidad, setSelectedEntidad] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      getEntidades().then(setEntidades);
      getCuentas().then(setCuentas);
      
      if (documento) {
        setFormData({
          tipo: documento.tipo,
          letra: documento.letra,
          numero: documento.numero,
          fecha: new Date(documento.fecha).toISOString().split('T')[0],
          vencimiento: documento.vencimiento ? new Date(documento.vencimiento).toISOString().split('T')[0] : "",
          cai: documento.cai || "",
          montoTotal: Number(documento.montoTotal),
          iva: Number(documento.iva),
          retencion: Number(documento.retencion),
          detalle: documento.detalle || "",
          entidadId: documento.entidadId,
          cuentaDebeId: documento.cuentaDebeId,
          cuentaHaberId: documento.cuentaHaberId,
          leyendaDebe: documento.leyendaDebe || "",
          leyendaHaber: documento.leyendaHaber || "",
          generarAsiento: !!documento.asientoId
        });
        setSelectedEntidad(documento.entidad);
      } else {
        // Reset form
        setFormData({
          tipo: "Factura",
          letra: "C",
          numero: "",
          fecha: new Date().toISOString().split('T')[0],
          vencimiento: "",
          cai: "",
          montoTotal: 0,
          iva: 0,
          retencion: 0,
          detalle: "",
          entidadId: null,
          cuentaDebeId: null,
          cuentaHaberId: null,
          leyendaDebe: "",
          leyendaHaber: "",
          generarAsiento: true
        });
        setSelectedEntidad(null);
      }
    }
  }, [isOpen, documento]);

  const filteredEntidades = entidades.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.cuit || "").includes(searchTerm)
  ).slice(0, 5);

  const handleSubmit = async () => {
    if (!selectedEntidad) {
      toast.error("Debe seleccionar un proveedor.");
      return;
    }
    if (!formData.numero) {
      toast.error("Debe ingresar el número de comprobante.");
      return;
    }
    if (formData.generarAsiento && (!formData.cuentaDebeId || !formData.cuentaHaberId)) {
      toast.error("Para generar el asiento debe seleccionar las cuentas de Debe y Haber.");
      return;
    }

    setLoading(true);
    try {
      const res = await upsertDocumentoProveedor({
        ...formData,
        id: documento?.id,
        entidadId: selectedEntidad.id,
        montoTotal: Number(formData.montoTotal),
        iva: Number(formData.iva),
        retencion: Number(formData.retencion)
      });

      if (res.success) {
        toast.success(documento ? "Documento actualizado." : "Documento registrado correctamente.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Error al guardar el documento.");
      }
    } catch (error) {
      toast.error("Error inesperado al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div key="vendor-invoice-modal" className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
          className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  {documento ? "Editar Factura Proveedor" : "Cargar Factura Proveedor"}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gestión de Compras y Gastos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-transparent hover:border-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* Step 1: Proveedor and Comprobante Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Proveedor Selector */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <User className="w-3 h-3" /> Proveedor
                  </label>
                  <div className="relative">
                    {selectedEntidad ? (
                      <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                        <div>
                          <p className="text-sm font-black text-indigo-900">{selectedEntidad.nombre}</p>
                          <p className="text-[10px] text-indigo-600 font-mono">{selectedEntidad.cuit || "Sin CUIT"}</p>
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
                            placeholder="Buscar proveedor..."
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
                                  onClick={() => { 
                                    setSelectedEntidad(ent); 
                                    setShowEntityResults(false); 
                                    if (ent.cuentaContableId) {
                                      setFormData(prev => ({ ...prev, cuentaHaberId: ent.cuentaContableId }));
                                    }
                                  }}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    >
                      <option value="Factura">Factura</option>
                      <option value="Nota de Crédito">Nota de Crédito</option>
                      <option value="Nota de Débito">Nota de Débito</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Letra</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      value={formData.letra}
                      onChange={(e) => setFormData({...formData, letra: e.target.value})}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="M">M</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      placeholder="0001-00000001"
                      value={formData.numero}
                      onChange={(e) => setFormData({...formData, numero: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Emisión
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      value={formData.fecha}
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Vencimiento
                    </label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      value={formData.vencimiento}
                      onChange={(e) => setFormData({...formData, vencimiento: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">C.A.I. / C.A.E.</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                      value={formData.cai}
                      onChange={(e) => setFormData({...formData, cai: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Totals Section */}
              <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Total</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-100"
                        value={formData.montoTotal}
                        onChange={(e) => setFormData({...formData, montoTotal: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IVA</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                        value={formData.iva}
                        onChange={(e) => setFormData({...formData, iva: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retención</label>
                      <input
                        type="number"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                        value={formData.retencion}
                        onChange={(e) => setFormData({...formData, retencion: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center text-slate-500 font-bold text-[10px] uppercase tracking-widest px-1">
                      <span>Neto a Pagar</span>
                      <span className="text-slate-900 text-sm font-black">
                        $ {(formData.montoTotal - formData.retencion).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle / Concepto</label>
                  <textarea
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 resize-none h-20"
                    placeholder="Descripción del gasto..."
                    value={formData.detalle}
                    onChange={(e) => setFormData({...formData, detalle: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Accounting Integration Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Integración Contable</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Generar Asiento Automático</span>
                  <button
                    onClick={() => setFormData({...formData, generarAsiento: !formData.generarAsiento})}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.generarAsiento ? "bg-emerald-500" : "bg-slate-200"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.generarAsiento ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {formData.generarAsiento && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100"
                >
                  {/* Debe */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Debe (Gasto / Stock)</span>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cuenta Contable</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountSelectType("debe");
                          setIsAccountSelectorOpen(true);
                        }}
                        className={`w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between ${
                          formData.cuentaDebeId ? "text-indigo-600 border-indigo-200" : "text-slate-400"
                        }`}
                      >
                        {formData.cuentaDebeId ? (
                          <span>{cuentas.find(c => c.id === formData.cuentaDebeId)?.nombre || "Cuenta Seleccionada"}</span>
                        ) : (
                          "Seleccionar cuenta..."
                        )}
                        <Search className="w-3 h-3 text-slate-300" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Leyenda</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                        placeholder="Leyenda para el renglón del Debe"
                        value={formData.leyendaDebe}
                        onChange={(e) => setFormData({...formData, leyendaDebe: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Haber */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Haber (Pasivo / Proveedores)</span>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cuenta Contable</label>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountSelectType("haber");
                          setIsAccountSelectorOpen(true);
                        }}
                        className={`w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between ${
                          formData.cuentaHaberId ? "text-emerald-600 border-emerald-200" : "text-slate-400"
                        }`}
                      >
                        {formData.cuentaHaberId ? (
                          <span>{cuentas.find(c => c.id === formData.cuentaHaberId)?.nombre || "Cuenta Seleccionada"}</span>
                        ) : (
                          "Seleccionar cuenta..."
                        )}
                        <Search className="w-3 h-3 text-slate-300" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Leyenda</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100"
                        placeholder="Leyenda para el renglón del Haber"
                        value={formData.leyendaHaber}
                        onChange={(e) => setFormData({...formData, leyendaHaber: e.target.value})}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4 text-slate-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-[10px] font-bold uppercase tracking-wider max-w-xs">
                Asegúrese de que los datos coincidan exactamente con el comprobante físico/digital para evitar inconsistencias impositivas.
              </p>
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
                disabled={loading}
                className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    GUARDAR DOCUMENTO
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AccountSearchDialog
        key="account-selector"
        isOpen={isAccountSelectorOpen}
        onClose={() => setIsAccountSelectorOpen(false)}
        cuentas={cuentas}
        onSelect={(cuenta) => {
          if (accountSelectType === "debe") {
            setFormData({...formData, cuentaDebeId: cuenta.id});
          } else {
            setFormData({...formData, cuentaHaberId: cuenta.id});
          }
          setIsAccountSelectorOpen(false);
        }}
      />
    </AnimatePresence>
  );
}
