"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  Database,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getAuditLogsAction } from "./audit-actions";
import { Pagination } from "@/components/Pagination";

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filtros
  const [entidad, setEntidad] = useState("");
  const [accion, setAccion] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await getAuditLogsAction({ 
        page, 
        pageSize, 
        entidad: entidad || undefined, 
        accion: (accion as any) || undefined 
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, entidad, accion]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE":
        return <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">CREACIÓN</span>;
      case "UPDATE":
        return <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">EDICIÓN</span>;
      case "DELETE":
        return <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">ELIMINACIÓN</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-full">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <History className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Historial de Auditoría</h1>
            <p className="text-sm text-slate-500">Trazabilidad de cambios en el sistema</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <select 
              value={entidad}
              onChange={(e) => { setEntidad(e.target.value); setPage(1); }}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
            >
              <option value="">Todas las entidades</option>
              <option value="Cuenta">Plan de Cuentas</option>
              <option value="Asiento">Asientos</option>
              <option value="Entidad">Entidades (Clientes/Prov)</option>
              <option value="FacturaDocente">Facturas Docentes</option>
              <option value="Ejercicio">Ejercicios</option>
              <option value="CentroCosto">Centros de Costo</option>
              <option value="DocumentoClientes">Doc. Clientes</option>
            </select>
          </div>

          <select 
            value={accion}
            onChange={(e) => { setAccion(e.target.value); setPage(1); }}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
          >
            <option value="">Todas las acciones</option>
            <option value="CREATE">Creaciones</option>
            <option value="UPDATE">Ediciones</option>
            <option value="DELETE">Eliminaciones</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entidad</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/20"></td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-slate-400 italic">No se encontraron registros de auditoría.</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr 
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => toggleExpand(log.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {format(new Date(log.cambiadoEn), "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">
                          ID: {log.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="size-4" />
                        </div>
                        <span className="text-sm text-slate-600">{log.cambiadoPor || "Sistema"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{log.entidad}</span>
                        <span className="text-xs text-slate-400 font-mono">#{log.entidadId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getActionBadge(log.accion)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {expandedId === log.id ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
                    </td>
                  </tr>
                  
                  {expandedId === log.id && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={5} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Anterior</h4>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-auto max-h-[300px] text-[11px] font-mono leading-relaxed shadow-inner">
                              {log.valoresAnt ? (
                                <pre className="text-red-600/80">
                                  {JSON.stringify(JSON.parse(log.valoresAnt), null, 2)}
                                </pre>
                              ) : (
                                <span className="text-slate-300 italic">Sin datos anteriores (Creación)</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Nuevo</h4>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-auto max-h-[300px] text-[11px] font-mono leading-relaxed shadow-inner">
                              {log.valoresNuev ? (
                                <pre className="text-green-600/80">
                                  {JSON.stringify(JSON.parse(log.valoresNuev), null, 2)}
                                </pre>
                              ) : (
                                <span className="text-slate-300 italic">Sin datos nuevos (Eliminación)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
          <Pagination 
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size as number);
              setPage(1);
            }}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </div>
    </div>
  );
}
