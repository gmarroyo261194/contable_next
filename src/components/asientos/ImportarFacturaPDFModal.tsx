// src/components/asientos/ImportarFacturaPDFModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  FileUp, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  Calendar, 
  Hash, 
  Tag, 
  Layers, 
  PlusCircle, 
  Briefcase 
} from "lucide-react";
import type { ExtractedFacturaData } from "@/lib/facturas/facturaParser";
import { saveFacturaImportada, parseFacturaPdfAction } from "@/lib/actions/sync-facturas-actions";

import { getRubros } from "@/lib/actions/rubro-actions";
import { getServicios } from "@/lib/actions/servicio-actions";

interface ImportarFacturaPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  empresaId: number;
}

export default function ImportarFacturaPDFModal({
  isOpen,
  onClose,
  onSuccess,
  empresaId
}: ImportarFacturaPDFModalProps) {
  const [rubros, setRubros] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedFacturaData | null>(null);
  const [selectedRubroId, setSelectedRubroId] = useState("");
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [showNuevaEntidad, setShowNuevaEntidad] = useState(false);
  const [nuevaEntidadCuit, setNuevaEntidadCuit] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setExtractedData(null);
      setError(null);
      setSelectedRubroId("");
      setSelectedServicioId("");
      setShowNuevaEntidad(false);
      setNuevaEntidadCuit("");
    } else {
      // Cargar rubros y servicios
      getRubros().then(setRubros).catch(console.error);
      if (empresaId) {
        getServicios(empresaId).then(setServicios).catch(console.error);
      }
    }
  }, [isOpen, empresaId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await parseFacturaPdfAction(formData);
      if (!res.success || !res.data) {
        throw new Error(res.error || "Error al procesar el comprobante.");
      }
      
      const result = res.data as ExtractedFacturaData;
      
      setExtractedData(result);
      if (result.cuitReceptor || result.cuitEmisor) {
        setNuevaEntidadCuit(result.cuitReceptor || result.cuitEmisor || "");
      }
    } catch (err: any) {
      setError(err.message || "Error al procesar el PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData || !selectedRubroId || !selectedServicioId) {
      setError("Por favor completa el rubro y servicio asociados.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        tipo: extractedData.tipoComprobante || `FACTURA ${extractedData.letra || 'C'}`,
        numero: `${extractedData.puntoVenta}-${extractedData.numero}`,
        fecha: extractedData.fechaEmision,
        montoTotal: extractedData.importeTotal,
        rubroId: parseInt(selectedRubroId),
        servicioId: parseInt(selectedServicioId),
        items: extractedData.items,
        nuevaEntidad: {
          nombre: extractedData.nombreReceptor || "Cliente S/N",
          cuit: nuevaEntidadCuit || extractedData.cuitReceptor || "00000000000"
        }
      };

      const res = await saveFacturaImportada(payload);

      if (!('error' in res) && res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError((res as any).error || "Error al guardar la factura.");
      }
    } catch (err) {
      setError("Error interno al guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <FileUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-none">Importar Factura</h3>
              <p className="text-slate-500 text-sm font-bold mt-1.5">Parser de Facturas AFIP v2.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-bold">{error}</div>
            </div>
          )}

          {!extractedData ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={loading}
              />
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="text-slate-600 font-black animate-pulse">Analizando PDF...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:shadow-indigo-100 transition-all border border-slate-100">
                    <FileUp className="w-8 h-8 text-indigo-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-900 font-black text-lg">Suelta el PDF aquí</p>
                    <p className="text-slate-500 font-bold">o haz clic para seleccionar</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Comprobante Info */}
                <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <Hash className="w-3.5 h-3.5" /> Datos del Comprobante
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">Tipo:</span>
                      <span className="text-slate-900 font-black px-2 py-1 bg-white rounded-lg border border-slate-100">{extractedData.letra} - {extractedData.tipoComprobante}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">Número:</span>
                      <span className="text-indigo-600 font-mono font-black">{extractedData.puntoVenta}-{extractedData.numero}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">Fecha:</span>
                      <div className="flex items-center gap-2 text-slate-900 font-black">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(extractedData.fechaEmision).toLocaleDateString('es-AR')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cliente / Receptor */}
                <div className="p-5 border border-slate-100 rounded-3xl bg-white shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest">
                    <Building2 className="w-3.5 h-3.5" /> Receptor / Cliente
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-900 font-black text-lg leading-tight uppercase">{extractedData.nombreReceptor || "No detectado"}</div>
                    <div className="text-slate-400 font-mono font-bold text-sm">{extractedData.cuitReceptor || "Sin CUIT"}</div>
                  </div>

                  {!extractedData.cuitReceptor && (
                    <div className="pt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1 block">Ingresar CUIT manualmente</label>
                      <input
                        type="text"
                        value={nuevaEntidadCuit}
                        onChange={(e) => setNuevaEntidadCuit(e.target.value)}
                        placeholder="CUIT"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              {extractedData.items && extractedData.items.length > 0 && (
                <div className="space-y-3 pb-2 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Detalle de ítems extraídos
                  </h4>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs bg-slate-50/30">
                    <table className="w-full text-left bg-white text-[11px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 font-black text-slate-400 uppercase tracking-tighter">
                          <th className="px-4 py-2">Descripción / Producto / Servicio</th>
                          <th className="px-4 py-2 text-center">Cant.</th>
                          <th className="px-4 py-2 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {extractedData.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-indigo-50/20 transition-colors">
                            <td className="px-4 py-2 text-slate-700 font-medium leading-relaxed italic">{item.descripcion}</td>
                            <td className="px-4 py-2 text-center text-slate-500 font-mono">{item.cantidad.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-black text-slate-900 font-mono">
                              {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.importeTotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Required Selection */}
              <div className="space-y-5 p-1">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                  <Tag className="w-4 h-4" /> Clasificación Requerida
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> Rubro
                    </label>
                    <select
                      value={selectedRubroId}
                      onChange={(e) => setSelectedRubroId(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar Rubro...</option>
                      {rubros.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" /> Servicio
                    </label>
                    <select
                      value={selectedServicioId}
                      onChange={(e) => setSelectedServicioId(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Seleccionar Servicio...</option>
                      {servicios
                        .filter(s => !selectedRubroId || s.rubroId === parseInt(selectedRubroId))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all hover:text-slate-700 shadow-sm"
          >
            Cancelar
          </button>
          
          {extractedData && (
            <button
              onClick={handleSave}
              disabled={loading || !selectedRubroId || !selectedServicioId}
              className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Confirmar e Importar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
