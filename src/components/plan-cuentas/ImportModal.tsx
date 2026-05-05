"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Check, Database } from "lucide-react";
import { importCuentas, importCuentasLegacy } from "@/app/plan-cuentas/actions";
import { ImportResult } from "@/types/cuenta";

interface ImportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportModal({ onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [anioOrigen, setAnioOrigen] = useState<number>(new Date().getFullYear());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  /**
   * Procesa la importación desde un archivo Excel local.
   */
  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = (e) => reject(new Error("Error al leer el archivo."));
        reader.readAsArrayBuffer(file);
      });
    };

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        throw new Error("El archivo está vacío.");
      }

      // Asegurar que el objeto sea plano (plain object) para evitar errores de serialización en Server Actions
      const plainJson = JSON.parse(JSON.stringify(json));
      const result = await importCuentas(plainJson);
      
      if (result.success) {
        setSuccess(true);
        onSuccess();
        setTimeout(onClose, 2000);
      }
    } catch (err: any) {
      console.error("Error en importancia:", err);
      setError(err.message || "Error al procesar el archivo Excel.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Dispara la sincronización desde la base de datos legacy.
   */
  const handleLegacyImport = async () => {
    if (!anioOrigen || anioOrigen < 1900 || anioOrigen > 2100) {
      setError("Por favor, ingrese un año válido.");
      return;
    }

    if (!confirm(`Se importarán las cuentas desde la base de datos Fundación para el ejercicio ${anioOrigen}. Si el ejercicio no existe en el sistema actual, se creará automáticamente. ¿Desea continuar?`)) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await importCuentasLegacy(anioOrigen);
      if (result.success) {
        setSuccess(true);
        onSuccess();
        setTimeout(onClose, 2000);
      } else {
        setError(result.message || "Error al importar desde legacy.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/50 transition-colors">
        <FileSpreadsheet className={`size-12 mb-4 ${file ? "text-primary" : "text-slate-300"}`} />
        
        {file ? (
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800 mb-1">{file.name}</p>
            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
            <button 
              onClick={() => setFile(null)}
              className="mt-3 text-xs text-red-500 font-bold hover:underline"
            >
              Quitar archivo
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700 mb-2">Selecciona un archivo Excel (.xlsx o .xls)</p>
            <label className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:border-primary transition-colors">
              <Upload className="size-3" />
              Elegir archivo
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
            </label>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <AlertCircle className="size-5 text-blue-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-blue-800">Instrucciones de importación</p>
          <p className="text-[10px] text-blue-600 leading-relaxed">
            El archivo debe contener las columnas: <strong>codigoCta</strong>, <strong>nombreCta</strong>, 
            <strong>codigoAlt</strong>, <strong>capitulo</strong> e <strong>imputable</strong>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 px-4 bg-amber-50/30 border border-amber-100 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Database className="size-24 rotate-12" />
        </div>
        
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm shadow-amber-200/50">
            <Database className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-800">Sincronización con Legacy</p>
            <p className="text-[11px] text-slate-500 font-medium">Conexión directa con la base ContableFundacion</p>
          </div>
        </div>

        <div className="flex items-end gap-3 pt-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-black text-amber-700 uppercase tracking-wider ml-1">Ejercicio de Origen</label>
            <input 
              type="number"
              value={anioOrigen}
              onChange={(e) => setAnioOrigen(parseInt(e.target.value))}
              placeholder="Ej: 2024"
              className="w-full bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleLegacyImport}
            disabled={loading || success}
            className="h-[42px] px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Sincronizando...
              </>
            ) : (
              "Sincronizar ahora"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleImport}
          disabled={!file || loading || success}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all ${
            success ? "bg-green-500 shadow-green-200" : "bg-primary shadow-primary/20 hover:bg-primary/90"
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <Check className="w-4 h-4" />
          ) : (
            "Iniciar Importación"
          )}
          {success ? "¡Completado!" : "Importar Datos"}
        </button>
      </div>
    </div>
  );
}
