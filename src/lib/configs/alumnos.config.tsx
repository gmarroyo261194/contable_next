import { GridConfig } from "@/components/ui/DataGrid";
import { Edit, Trash2, Mail, Phone } from "lucide-react";

export const alumnoGridConfig = (
  onEdit: (alumno: any) => void,
  onDelete: (alumno: any) => void
): GridConfig<any> => ({
  columns: [
    {
      key: "documento",
      header: "Documento",
      sortable: true,
      render: (alumno) => (
        <div className="font-bold text-slate-900 uppercase">{alumno.documento}</div>
      )
    },
    {
      key: "apellido",
      header: "Apellido y Nombre",
      sortable: true,
      render: (alumno) => (
        <div className="font-bold text-slate-900 uppercase">
          {alumno.apellido}, {alumno.nombre}
        </div>
      )
    },
    {
      key: "email",
      header: "Contacto",
      render: (alumno) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Mail className="w-3 h-3 text-slate-400" />
            {alumno.email || 'Sin email'}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Phone className="w-3 h-3 text-slate-400" />
            {alumno.celular || alumno.telefono || 'Sin teléfono'}
          </div>
        </div>
      )
    },
    {
      key: "actions",
      header: "Acciones",
      className: "text-center"
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
  ]
});
