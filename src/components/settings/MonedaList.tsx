"use client";

import React from "react";
import { 
  Coins, 
  Pencil, 
  Trash2, 
  Search,
  Hash,
  Tag
} from "lucide-react";
import { deleteMoneda } from "@/app/settings/monedas/actions";

interface MonedaListProps {
  monedas: any[];
  onEdit: (moneda: any) => void;
}

export function MonedaList({ monedas, onEdit }: MonedaListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredMonedas = monedas.filter(m => 
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta moneda?")) {
      try {
        await deleteMoneda(id);
      } catch (error: any) {
        alert(error.message || "Error al eliminar la moneda.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMonedas.map((moneda) => (
          <div 
            key={moneda.id} 
            className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="text-xl font-black">{moneda.simbolo}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => onEdit(moneda)}
                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  <Pencil className="size-4" />
                </button>
                <button 
                  onClick={() => handleDelete(moneda.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                {moneda.nombre}
              </h3>
              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <Tag className="size-3" />
                {moneda.codigo}
              </div>
            </div>
          </div>
        ))}

        {filteredMonedas.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Coins className="size-12 opacity-20" />
            <p className="font-medium">No se encontraron monedas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
