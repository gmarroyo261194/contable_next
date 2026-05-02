import { GridConfig } from "@/components/ui/DataGrid";
import { 
  UserCheck, 
  Building2, 
  Users, 
  User, 
  Pencil, 
  Trash2 
} from "lucide-react";
import React from "react";

export const entidadGridConfig = (
  onEdit: (entidad: any) => void,
  onDelete: (id: number) => void,
  options: { hideEmpresa?: boolean } = {}
): GridConfig<any> => ({
  columns: [
    {
      key: "nombre",
      header: "Nombre / Razón Social",
      sortable: true,
      render: (e) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            {e.tipo?.nombre === 'CLIENTE' ? <UserCheck className="size-4" /> :
              e.tipo?.nombre === 'PROVEEDOR' ? <Building2 className="size-4" /> :
              e.tipo?.nombre === 'DOCENTE' ? <Users className="size-4" /> :
              <User className="size-4" />}
          </div>
          <span className="font-bold text-slate-800">{e.nombre}</span>
        </div>
      )
    },
    ...(!options.hideEmpresa ? [{
      key: "empresa",
      header: "Empresa",
      render: (e: any) => (
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[150px]">
          {e.empresa?.nombreFantasia || e.empresa?.razonSocial}
        </span>
      )
    }] : []),
    { 
      key: "cuit", 
      header: "CUIT / CUIL", 
      className: "font-mono text-xs" 
    },
    { 
      key: "nroDoc", 
      header: "DNI", 
      className: "font-mono text-xs" 
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (e) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          e.tipo?.nombre === 'CLIENTE' ? 'bg-blue-50 text-blue-600' :
          e.tipo?.nombre === 'PROVEEDOR' ? 'bg-orange-50 text-orange-600' :
          e.tipo?.nombre === 'DOCENTE' ? 'bg-emerald-50 text-emerald-600' :
          'bg-purple-50 text-purple-600'
        }`}>
          {e.tipo?.nombre || 'S/D'}
        </span>
      )
    },
    {
      key: "cuentaContable",
      header: "Cuenta Contable",
      render: (e) => (
        <span className="text-xs font-bold text-slate-500">
          {e.cuentaContable ? (
            <div className="flex flex-col">
              <span className="text-slate-700">{e.cuentaContable.nombre}</span>
              <span className="text-[10px] text-slate-400 font-mono">{e.cuentaContable.codigo}</span>
            </div>
          ) : (
            <span className="italic text-slate-300">No asignada</span>
          )}
        </span>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right"
    }
  ],
  actions: [
    {
      label: "Editar",
      icon: Pencil,
      onClick: onEdit,
      variant: "info"
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: (e) => onDelete(e.id),
      variant: "danger"
    }
  ]
});
