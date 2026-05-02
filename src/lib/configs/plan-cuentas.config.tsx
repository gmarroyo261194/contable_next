import { GridConfig } from "@/components/ui/DataGrid";
import { Pencil, Trash2 } from "lucide-react";
import { Cuenta } from "@/types/cuenta";

/**
 * Genera la configuración del DataGrid para el Plan de Cuentas.
 * 
 * @param onEdit - Callback para editar cuenta.
 * @param onDelete - Callback para eliminar cuenta.
 * @param isTreeView - Indica si se debe habilitar el modo jerárquico.
 */
export const planCuentasGridConfig = (
  onEdit: (cuenta: Cuenta) => void,
  onDelete: (id: number) => void,
  isTreeView: boolean
): GridConfig<Cuenta> => ({
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
      key: "nombre",
      header: "Cuenta Contable",
      render: (c) => (
        <span className={`text-sm tracking-tight ${c.imputable ? 'text-slate-600 font-medium' : 'font-black text-slate-900 uppercase'}`}>
          {c.nombre}
        </span>
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
  tree: isTreeView ? {
    enabled: true,
    parentField: "padreId",
    hasChildrenField: "hasChildren",
    levelField: "level"
  } : undefined,
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
