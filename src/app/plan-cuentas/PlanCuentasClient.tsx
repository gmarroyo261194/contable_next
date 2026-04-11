"use client";

import React from "react";
import { Plus, Pencil, Trash2, FileSpreadsheet, Search, GitGraph, Tag, AlertCircle, Layers, ListTree, Download } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { CuentaForm } from "@/components/plan-cuentas/CuentaForm";
import { ImportModal } from "@/components/plan-cuentas/ImportModal";
import { deleteCuenta } from "@/app/plan-cuentas/actions";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';

export function PlanCuentasClient({ initialCuentas }: { initialCuentas: any[] }) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingCuenta, setEditingCuenta] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [groupByTipo, setGroupByTipo] = React.useState(false);
  const [isTreeView, setIsTreeView] = React.useState(false);

  const router = useRouter();

  const handleCreate = () => {
    setEditingCuenta(null);
    setIsFormOpen(true);
  };

  const handleEdit = (cuenta: any) => {
    setEditingCuenta(cuenta);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta cuenta?")) {
      try {
        await deleteCuenta(id);
        router.refresh();
      } catch (error: any) {
        alert(error.message || "Error al eliminar la cuenta.");
      }
    }
  };

  // Funciones para Jerarquía
  const buildTree = (cuentas: any[]) => {
    // Si no hay datos, retornar vacío
    if (!cuentas || cuentas.length === 0) return [];

    // Copiamos para no mutar y ordenamos por longitud de código para procesar padres antes que hijos
    const rawCuentas = [...cuentas].sort((a, b) => a.codigo.length - b.codigo.length || a.codigo.localeCompare(b.codigo));
    
    const map: { [key: number]: any } = {};
    const roots: any[] = [];

    // 1. Poblar el mapa con todos los nodos inicializados
    rawCuentas.forEach(c => {
      map[c.id] = { ...c, children: [] };
    });

    // 2. Construir la estructura de árbol
    rawCuentas.forEach(c => {
      let actualPadreId = c.padreId;
      
      // Fallback: Si no tiene padreId configurado en DB, detectamos por prefijo de código
      if (!actualPadreId) {
        const cClean = c.codigo.replace(/0+$/, ''); // Eliminar ceros al final para comparar jerarquía
        let longestPrefix = "";
        
        rawCuentas.forEach(p => {
          const pClean = p.codigo.replace(/0+$/, '');
          // Si el código de p es prefijo de c y p es más corto
          if (cClean.startsWith(pClean) && cClean !== pClean) {
            if (pClean.length > longestPrefix.length) {
              longestPrefix = pClean;
              actualPadreId = p.id;
            }
          }
        });
      }

      const node = map[c.id];
      if (node) { // Verificación de seguridad
        if (actualPadreId && map[actualPadreId]) {
          map[actualPadreId].children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };

  const flattenTree = (tree: any[], level = 0): any[] => {
    let result: any[] = [];
    // Ordenar por código dentro de cada nivel
    const sortedNodes = [...tree].sort((a, b) => a.codigo.localeCompare(b.codigo));

    sortedNodes.forEach(node => {
      result.push({ ...node, level });
      if (node.children.length > 0) {
        result = result.concat(flattenTree(node.children, level + 1));
      }
    });
    return result;
  };

  const exportToExcel = (data: any[], filename: string) => {
    const isHierarchical = data.some(d => (d.level ?? 0) > 0);

    const worksheetData = data.map(c => {
      const row: any = {
        "Código": c.codigo,
        "Nombre": isHierarchical ? "      ".repeat(c.level || 0) + (c.imputable ? c.nombre : c.nombre.toUpperCase()) : c.nombre,
        "Tipo": c.tipo,
        "Imputable": c.imputable ? 'SI' : 'NO'
      };
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Ajustar anchos de columna
    const wscols = [
      { wch: 20 },
      { wch: 50 },
      { wch: 15 },
      { wch: 10 }
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plan de Cuentas");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleExportTree = () => {
    const tree = buildTree(initialCuentas);
    const flatTree = flattenTree(tree);
    exportToExcel(flatTree, "Plan_Cuentas_Jerarquico");
  };

  const treeData = React.useMemo(() => {
    if (!isTreeView) return initialCuentas;
    const tree = buildTree(initialCuentas);
    return flattenTree(tree);
  }, [initialCuentas, isTreeView]);

  const filteredCuentas = treeData.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.codigo.includes(searchTerm)
  );

  const columns = [
    {
      header: "Código",
      accessor: "codigo",
      className: "w-40",
      cell: (c: any) => (
        <span className={`font-mono text-xs ${c.imputable ? 'text-slate-600' : 'font-black text-slate-900'}`}>
          {c.codigo}
        </span>
      )
    },
    {
      header: "Nombre / Cuenta",
      accessor: "nombre",
      cell: (c: any) => (
        <div 
          className="flex flex-col relative py-1"
          style={{ 
            paddingLeft: isTreeView ? `${(c.level || 0) * 64}px` : '0px',
            transition: 'padding 0.2s'
          }}
        >
          {/* Guía visual para niveles con mayor contraste */}
          {isTreeView && (c.level || 0) > 0 && (
            <div 
              className="absolute top-0 bottom-0 flex items-center" 
              style={{ left: `${((c.level || 0) - 1) * 64 + 28}px` }}
            >
              <div className="w-px h-full bg-slate-300" />
              <div className="w-8 h-px bg-slate-300" />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {isTreeView && (c.level || 0) > 0 && (
              <div className="size-1.5 bg-primary/40 rounded-full flex-shrink-0" />
            )}
            <span className={`text-sm tracking-tight ${c.imputable ? 'text-slate-600 font-medium' : 'font-black text-slate-900 uppercase'}`}>
              {c.nombre}
            </span>
          </div>
        </div>
      )
    },
    {
      header: "Tipo",
      accessor: "tipo",
      className: "w-32",
      cell: (c: any) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.tipo === 'ACTIVO' ? 'bg-green-50 text-green-600' :
          c.tipo === 'PASIVO' ? 'bg-red-50 text-red-600' :
            c.tipo === 'RESULTADO' ? 'bg-amber-50 text-amber-600' :
              'bg-slate-50 text-slate-600'
          }`}>
          {c.tipo}
        </span>
      )
    },
    {
      header: "Imputable",
      accessor: "imputable",
      className: "w-24",
      cell: (c: any) => (
        <span className={`text-[10px] font-black uppercase ${c.imputable ? 'text-blue-600' : 'text-slate-300'}`}>
          {c.imputable ? 'Si' : 'No'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Plan de Cuentas</h2>
          <p className="text-slate-500 text-sm">Gestiona el catálogo de cuentas contables</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold text-sm text-slate-700 transition-all font-display"
            title="Importar Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="hidden lg:inline">Importar</span>
          </button>

          <button
            onClick={() => {
              if (isTreeView) {
                handleExportTree();
              } else {
                exportToExcel(filteredCuentas, "Plan_Cuentas");
              }
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold text-sm text-slate-700 transition-all font-display"
            title="Exportar Excel"
          >
            <Download className="w-4 h-4 text-primary" />
            <span className="hidden lg:inline">Exportar</span>
          </button>

          <button
            onClick={handleCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary px-6 py-2.5 rounded-xl font-bold text-sm text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-display"
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
          data={treeData}
          columns={columns}
          pageSize={isTreeView ? 1000 : 25}
          groupBy={groupByTipo ? "tipo" : undefined}
          actions={(item) => (
            <>
              <button
                onClick={() => handleEdit(item)}
                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                title="Editar"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        />
      )}

      {/* Form Dialog */}
      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCuenta ? "Editar Cuenta" : "Nueva Cuenta Contable"}
      >
        <CuentaForm
          initialData={editingCuenta}
          cuentas={initialCuentas}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Importar Plan de Cuentas"
      >
        <ImportModal
          onClose={() => setIsImportOpen(false)}
          onSuccess={() => router.refresh()}
        />
      </Dialog>
    </div>
  );
}
