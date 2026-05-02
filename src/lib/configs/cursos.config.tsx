import { GridConfig } from "@/components/ui/DataGrid";
import { Edit, Trash2, Calendar } from "lucide-react";

export const cursoGridConfig = (
  onEdit: (curso: any) => void,
  onDelete: (curso: any) => void,
  groupByRubro: boolean
): GridConfig<any> => ({
  columns: [
    {
      key: "nombre",
      header: "Nombre",
      sortable: true,
      render: (curso) => (
        <div>
          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{curso.nombre}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            ID Legacy: {curso.legacyId || 'N/A'} • {curso.anioAcademico} • {curso.cantidadCuotas} Cuotas
          </div>
        </div>
      )
    },
    {
      key: "rubro",
      header: "Rubro",
      sortable: true,
      render: (curso) => (
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
          {curso.rubro?.nombre}
        </span>
      )
    },
    {
      key: "servicio",
      header: "Servicio",
      sortable: true,
      render: (curso) => (
        <span className="text-xs font-medium text-slate-500">{curso.servicio?.nombre}</span>
      )
    },
    {
      key: "fechaInicio",
      header: "Periodo",
      className: "text-center",
      render: (curso) => (
        <div className="flex flex-col items-center gap-0.5">
          <Calendar className="w-3 h-3 text-slate-300" />
          <span className="text-[10px] font-black text-slate-600 uppercase">
            {curso.fechaInicio ? new Date(curso.fechaInicio).toLocaleDateString() : '-'}
          </span>
        </div>
      )
    },
    {
      key: "costo",
      header: "Costo",
      type: "currency",
      className: "text-right",
      sortable: true
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
      icon: Edit,
      onClick: onEdit,
      variant: "info"
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: onDelete,
      variant: "danger"
    }
  ],
  groupBy: groupByRubro ? "rubroNombre" : undefined
});
