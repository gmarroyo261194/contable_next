import { GridConfig } from "@/components/ui/DataGrid";
import { Edit, Trash2, ListChecks, BookUser } from "lucide-react";

/**
 * Configuración del DataGrid para la grilla de inscripciones.
 * @param onEdit - Callback para editar una inscripción.
 * @param onDelete - Callback para eliminar una inscripción.
 * @param onCuotas - Callback para navegar a las cuotas de la inscripción.
 */
export const inscripcionGridConfig = (
  onEdit: (item: any) => void,
  onDelete: (item: any) => void,
  onCuotas: (item: any) => void
): GridConfig<any> => ({
  columns: [
    {
      key: "alumno",
      header: "Alumno",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900 uppercase">
            {item.alumno?.apellido}, {item.alumno?.nombre}
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            DNI: {item.alumno?.documento}
          </div>
        </div>
      ),
    },
    {
      key: "curso",
      header: "Curso",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-slate-800">{item.curso?.nombre}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {item.curso?.rubro?.nombre} • {item.curso?.anioAcademico}
          </div>
        </div>
      ),
    },
    {
      key: "fechaInscripcion",
      header: "Fecha Inscripción",
      type: "date",
      sortable: true,
      className: "text-center",
    },
    {
      key: "estado",
      header: "Estado",
      className: "text-center",
      render: (item) => {
        const colors: Record<string, string> = {
          Activa: "bg-emerald-100 text-emerald-700",
          Baja: "bg-red-100 text-red-600",
          Pendiente: "bg-amber-100 text-amber-700",
        };
        const cls = colors[item.estado] || "bg-slate-100 text-slate-600";
        return (
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${cls}`}>
            {item.estado}
          </span>
        );
      },
    },
    {
      key: "_count",
      header: "Cuotas",
      className: "text-center",
      render: (item) => (
        <span className="text-xs font-bold text-slate-600">
          {item._count?.cuotas ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-right",
    },
  ],
  actions: [
    {
      label: "Ver Cuotas",
      icon: ListChecks,
      onClick: onCuotas,
      variant: "warning",
    },
    {
      label: "Editar",
      icon: Edit,
      onClick: onEdit,
      variant: "info",
    },
    {
      label: "Eliminar",
      icon: Trash2,
      onClick: onDelete,
      variant: "danger",
    },
  ],
});
