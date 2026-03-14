"use client";

import React from "react";
import { 
  Building2, 
  Pencil, 
  Trash2, 
  Plus, 
  Search,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from "lucide-react";
import { deleteEmpresa } from "@/app/empresas/actions";

interface EmpresaListProps {
  empresas: any[];
  onEdit: (empresa: any) => void;
}

export function EmpresaList({ empresas, onEdit }: EmpresaListProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredEmpresas = empresas.filter(e => 
    e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cuit.includes(searchTerm)
  );

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta empresa?")) {
      try {
        await deleteEmpresa(id);
      } catch (error) {
        alert("Error al eliminar la empresa. Verifique que no tenga datos asociados.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o CUIT..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmpresas.map((empresa) => (
          <div 
            key={empresa.id} 
            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Building2 className="size-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onEdit(empresa)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(empresa.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                  {empresa.nombre}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  CUIT: {empresa.cuit}
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  {empresa.moneda?.nombre}
                </p>
              </div>

              <div className="space-y-3">
                {empresa.email && (
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <Mail className="size-4 text-slate-400" />
                    <span className="truncate">{empresa.email}</span>
                  </div>
                )}
                {empresa.telefono && (
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <Phone className="size-4 text-slate-400" />
                    {empresa.telefono}
                  </div>
                )}
                {empresa.direccion && (
                  <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <MapPin className="size-4 text-slate-400" />
                    <span className="truncate">{empresa.direccion}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                Registrada el {new Date(empresa.createdAt).toLocaleDateString()}
              </span>
              <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
                Gestionar <ExternalLink className="size-3" />
              </button>
            </div>
          </div>
        ))}

        {filteredEmpresas.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Building2 className="size-12 opacity-20" />
            <p className="font-medium">No se encontraron empresas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
