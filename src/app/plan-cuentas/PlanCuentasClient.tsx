"use client";

import React from "react";
import { Plus, FileSpreadsheet, GitGraph, Layers, ListTree, Download, AlertCircle } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { CuentaForm } from "@/components/plan-cuentas/CuentaForm";
import { ImportModal } from "@/components/plan-cuentas/ImportModal";
import { deleteCuenta, getCuentas } from "@/app/plan-cuentas/actions";
import { useRouter } from "next/navigation";
import XLSX from 'xlsx-js-style';
import { planCuentasGridConfig } from "@/lib/configs/plan-cuentas.config";
import { toast } from "sonner";
import { Cuenta } from "@/types/cuenta";

/**
 * Componente principal para la gestión del Plan de Cuentas.
 * 
 * @param initialCuentas - Lista inicial de cuentas.
 */
export function PlanCuentasClient({ initialCuentas }: { initialCuentas: Cuenta[] }) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingCuenta, setEditingCuenta] = React.useState<Cuenta | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [groupByTipo, setGroupByTipo] = React.useState(false);
  const [isTreeView, setIsTreeView] = React.useState(false);

  const router = useRouter();

  const handleCreate = () => {
    setEditingCuenta(null);
    setIsFormOpen(true);
  };

  /** Abre el formulario para edición. */
  const handleEdit = (cuenta: Cuenta) => {
    setEditingCuenta(cuenta);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta cuenta?")) {
      try {
        await deleteCuenta(id);
        toast.success("Cuenta eliminada");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Error al eliminar la cuenta.");
      }
    }
  };

  /** Carga hijos en modo jerárquico. */
  const handleLoadChildren = async (parentId: number): Promise<Cuenta[]> => {
    return await getCuentas(parentId);
  };

  /** Exportación a Excel con estilos. */
  const exportToExcel = (data: Cuenta[], filename: string) => {
    const worksheetDataRaw = data.map(c => {
      const nameValue = c.imputable ? c.nombre : c.nombre.toUpperCase();
      return {
        "Código": c.codigo,
        "Nombre": nameValue,
        "Código Corto": c.codigoCorto || "",
        "Tipo": c.tipo,
        "Imputable": c.imputable ? 'SI' : 'NO'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(worksheetDataRaw);
    data.forEach((c, idx) => {
      const rowIndex = idx + 2;
      const nameCell = `B${rowIndex}`;
      if (worksheet[nameCell]) {
        let color = "000000";
        if (c.imputable) {
          if (c.tipo === 'ACTIVO') color = "0000FF";
          else if (c.tipo === 'PASIVO') color = "FF0000";
          else if (c.tipo === 'RESULTADO') color = "008000";
        }
        worksheet[nameCell].s = {
          font: { 
            color: { rgb: color },
            bold: !c.imputable
          }
        };
      }
    });
    const wscols = [{ wch: 18 }, { wch: 50 }, { wch: 12 }, { wch: 15 }, { wch: 10 }];
    worksheet['!cols'] = wscols;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plan de Cuentas");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const filteredData = React.useMemo(() => {
    if (isTreeView) {
      // En modo jerárquico, solo mostramos las raíces al inicio
      return initialCuentas.filter(c => !c.padreId);
    }
    return initialCuentas;
  }, [initialCuentas, isTreeView]);

  const config = React.useMemo(() => {
    const baseConfig = planCuentasGridConfig(handleEdit, handleDelete, isTreeView);
    if (groupByTipo) {
      baseConfig.groupBy = "tipo";
    }
    return baseConfig;
  }, [isTreeView, groupByTipo]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Plan de Cuentas</h2>
          <p className="text-slate-500 font-medium italic">Gestión del catálogo contable</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="hidden lg:inline">Importar</span>
          </button>

          <button
            onClick={() => exportToExcel(initialCuentas, "Plan_Cuentas")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-700 transition-all"
          >
            <Download className="w-4 h-4 text-primary" />
            <span className="hidden lg:inline">Exportar</span>
          </button>

          <button
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => { setIsTreeView(false); setGroupByTipo(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${!isTreeView && !groupByTipo ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Listado Simple
          </button>
          <button
            onClick={() => { setIsTreeView(false); setGroupByTipo(true); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${groupByTipo ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Layers className="size-3" />
            Por Tipo
          </button>
          <button
            onClick={() => { setIsTreeView(true); setGroupByTipo(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isTreeView ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ListTree className="size-3" />
            Jerárquico
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3 w-fit">
          <GitGraph className="size-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black text-slate-400">Total Cuentas</span>
            <span className="text-sm font-bold text-slate-800">{initialCuentas.length}</span>
          </div>
        </div>
      </div>

      {initialCuentas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center px-4">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="size-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No hay cuentas registradas</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-8">
            Comienza importando tu plan de cuentas desde un archivo Excel o crea una cuenta manualmente.
          </p>
          <div className="flex gap-4">
            <button onClick={() => setIsImportOpen(true)} className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <FileSpreadsheet className="size-4 text-green-600" />
              Importar de Excel
            </button>
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2 px-8 py-2.5 shadow-lg shadow-primary/20">
              <Plus className="size-4" />
              Crear Manualmente
            </button>
          </div>
        </div>
      ) : (
        <DataGrid
          config={config}
          data={filteredData}
          pageSize={isTreeView ? 1000 : 25}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre o código..."
          onLoadChildren={isTreeView ? handleLoadChildren : undefined}
        />
      )}

      {/* Form Dialog */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCuenta ? "Editar Cuenta" : "Nueva Cuenta Contable"}>
        <CuentaForm initialData={editingCuenta} cuentas={initialCuentas} onClose={() => setIsFormOpen(false)} onSuccess={() => router.refresh()} />
      </Dialog>

      {/* Import Dialog */}
      <Dialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importar Plan de Cuentas">
        <ImportModal onClose={() => setIsImportOpen(false)} onSuccess={() => router.refresh()} />
      </Dialog>
    </div>
  );
}
