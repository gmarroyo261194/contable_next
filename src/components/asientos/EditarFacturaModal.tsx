// src/components/asientos/EditarFacturaModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Hash, 
  Tag, 
  Layers, 
  PlusCircle, 
  Briefcase,
  Edit3
} from "lucide-react";
import { updateDocumentoCliente } from "@/lib/actions/sync-facturas-actions";
import { getRubros } from "@/lib/actions/rubro-actions";
import { getServicios } from "@/lib/actions/servicio-actions";
import { format } from "date-fns";

interface EditarFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  documento: any;
  empresaId: number;
}

export default function EditarFacturaModal({
  isOpen,
  onClose,
  onSuccess,
  documento,
  empresaId
}: EditarFacturaModalProps) {
  const [rubros, setRubros] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fecha, setFecha] = useState("");
  const [selectedRubroId, setSelectedRubroId] = useState("");
  const [selectedServicioId, setSelectedServicioId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [montoTotal, setMontoTotal] = useState(0);

  useEffect(() => {
    if (isOpen && documento) {
      setFecha(format(new Date(documento.fecha), 'yyyy-MM-dd'));
      setSelectedRubroId(documento.rubroId?.toString() || "");
      setSelectedServicioId(documento.servicioId?.toString() || "");
      setItems(documento.items?.map((item: any) => ({
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precioUnitario: Number(item.precioUnitario),
        importeTotal: Number(item.importeTotal)
      })) || []);
      setMontoTotal(Number(documento.montoTotal));
      
      // Load rubros and services
      getRubros().then(setRubros).catch(console.error);
      if (empresaId) {
        getServicios(empresaId).then(setServicios).catch(console.error);
      }
    }
  }, [isOpen, documento, empresaId]);

  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[idx] };
    
    if (field === 'cantidad') item.cantidad = parseFloat(value) || 0;
    else if (field === 'precioUnitario') item.precioUnitario = parseFloat(value) || 0;
    else if (field === 'descripcion') item.descripcion = value;
    
    item.importeTotal = item.cantidad * item.precioUnitario;
    newItems[idx] = item;
    
    const newTotal = newItems.reduce((acc, curr) => acc + curr.importeTotal, 0);
    setItems(newItems);
    setMontoTotal(newTotal);
  };

  const removeItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx);
    const newTotal = newItems.reduce((acc, curr) => acc + curr.importeTotal, 0);
    setItems(newItems);
    setMontoTotal(newTotal);
  };

  const addItem = () => {
    const newItem = {
      descripcion: "Nuevo ítem",
      cantidad: 1,
      precioUnitario: 0,
      importeTotal: 0
    };
    setItems([...items, newItem]);
  };

  const handleSave = async () => {
    if (!selectedServicioId) {
      setError("Por favor selecciona un servicio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await updateDocumentoCliente(documento.id, {
        fecha,
        rubroId: selectedRubroId ? parseInt(selectedRubroId) : null,
        servicioId: selectedServicioId ? parseInt(selectedServicioId) : null,
        montoTotal,
        items
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Error al actualizar la factura.");
      }
    } catch (err) {
      setError("Error interno al guardar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !documento) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Edit3 className="text-white w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 leading-none">Editar Factura</h3>
              <p className="text-slate-500 text-sm font-bold mt-1.5">{documento.numero} - {documento.entidad?.nombre}</p>
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

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Fecha */}
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Fecha de Emisión
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>

              {/* Rubro */}
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Rubro
                </label>
                <select
                  value={selectedRubroId}
                  onChange={(e) => setSelectedRubroId(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {rubros.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Servicio */}
              <div className="md:col-span-5 space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" /> Servicio
                </label>
                <select
                  value={selectedServicioId}
                  onChange={(e) => setSelectedServicioId(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {servicios
                    .filter(s => !selectedRubroId || s.rubroId === parseInt(selectedRubroId))
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Detalle de ítems
                </h4>
                <button 
                  onClick={addItem}
                  className="text-[10px] font-black text-indigo-600 uppercase hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Agregar ítem
                </button>
              </div>
              
              <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-xs bg-slate-50/30">
                <table className="w-full text-left bg-white text-[11px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 font-black text-slate-400 uppercase tracking-tighter">
                      <th className="px-5 py-3">Descripción</th>
                      <th className="px-5 py-3 text-center w-24">Cant.</th>
                      <th className="px-5 py-3 text-right w-32">P. Unitario</th>
                      <th className="px-5 py-3 text-right w-32">Subtotal</th>
                      <th className="px-5 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item: any, idx: number) => (
                      <tr key={idx} className="group hover:bg-indigo-50/10 transition-colors">
                        <td className="px-5 py-3">
                          <textarea
                            value={item.descripcion}
                            onChange={(e) => handleItemChange(idx, 'descripcion', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-slate-700 font-medium italic resize-none leading-relaxed placeholder:text-slate-300"
                            rows={2}
                          />
                        </td>
                        <td className="px-5 py-3">
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                            className="w-full bg-slate-50/50 border-none rounded-lg px-2 py-1.5 text-center font-mono text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-100 outline-none transition-all"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1 bg-slate-50/50 rounded-lg px-2 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-100 transition-all">
                            <span className="text-slate-400">$</span>
                            <input
                              type="number"
                              value={item.precioUnitario}
                              onChange={(e) => handleItemChange(idx, 'precioUnitario', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-right font-mono text-slate-600 focus:ring-0 outline-none"
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-black text-slate-900 font-mono">
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.importeTotal)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button 
                            onClick={() => removeItem(idx)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/50 font-black">
                    <tr>
                      <td colSpan={3} className="px-5 py-4 text-right text-slate-500 uppercase tracking-widest text-[10px]">Importe Total</td>
                      <td className="px-5 py-4 text-right text-indigo-600 text-sm font-mono">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(montoTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all hover:text-slate-700 shadow-sm"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
