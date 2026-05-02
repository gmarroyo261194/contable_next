import { GridConfig } from "@/components/ui/DataGrid";
import { Pencil, Trash2 } from "lucide-react";

export const planCuentasGridConfig = (
  onEdit: (cuenta: any) => void,
  onDelete: (id: number) => void,
  isTreeView: boolean
): GridConfig<any> => ({
  columns: [
    {
      key: "codigo",
      header: "Código",
      className: "w-40",
      render: (c) => (
        <span className={`font-mono text-xs ${c.imputable ? 'text-slate-600' : 'font-black text-slate-900'}`}>
          {c.codigo}
        </span>
      )
    },
    {
      key: "empresa",
      header: "Empresa / Ejercicio",
      render: (c) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter truncate max-w-[150px]">
            {c.ejercicio?.empresa?.nombreFantasia || c.ejercicio?.empresa?.razonSocial}
          </span>
          <span className="text-[9px] font-bold text-slate-400">
            Eje. {c.ejercicio?.numero}
          </span>
        </div>
      )
    },
    {
      key: "nombre",
      header: "Nombre / Cuenta",
      render: (c) => (
        <div 
          className="flex flex-col relative py-1"
          style={{ 
            paddingLeft: isTreeView ? `${(c.level || 0) * 32}px` : '0px',
            transition: 'padding 0.2s'
          }}
        >
          {isTreeView && (c.level || 0) > 0 && (
            <div 
              className="absolute top-0 bottom-0 flex items-center" 
              style={{ left: `${((c.level || 0) - 1) * 32 + 12}px` }}
            >
              <div className="w-px h-full bg-slate-200" />
              <div className="w-4 h-px bg-slate-200" />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {isTreeView && (c.level || 0) > 0 && (
              <div className="size-1 bg-primary/40 rounded-full flex-shrink-0" />
            )}
            <span className={`text-sm tracking-tight ${c.imputable ? 'text-slate-600 font-medium' : 'font-black text-slate-900 uppercase'}`}>
              {c.nombre}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "tipo",
      header: "Tipo",
      className: "w-32",
      render: (c) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          c.tipo === 'ACTIVO' ? 'bg-green-50 text-green-600' :
          c.tipo === 'PASIVO' ? 'bg-red-50 text-red-600' :
          c.tipo === 'RESULTADO' ? 'bg-amber-50 text-amber-600' :
          'bg-slate-50 text-slate-600'
        }`}>
          {c.tipo}
        </span>
      )
    },
    {
      key: "imputable",
      header: "Imputable",
      className: "w-24",
      render: (c) => (
        <span className={`text-[10px] font-black uppercase ${c.imputable ? 'text-blue-600' : 'text-slate-300'}`}>
          {c.imputable ? 'Si' : 'No'}
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
      onClick: (c) => onDelete(c.id),
      variant: "danger"
    }
  ]
});
