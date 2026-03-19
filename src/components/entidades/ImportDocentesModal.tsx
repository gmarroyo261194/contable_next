"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, Loader2, Check, UserPlus } from "lucide-react";
import { importEntidadesDocentes } from "@/app/entidades/actions";

interface ImportDocentesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportDocentesModal({ onClose, onSuccess }: ImportDocentesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

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

      // Sanitizar JSON para Server Action
      const plainJson = JSON.parse(JSON.stringify(json));
      const result = await importEntidadesDocentes(plainJson);
      
      if (result.success) {
        setSuccess(true);
        onSuccess();
        setTimeout(onClose, 2000);
      }
    } catch (err: any) {
      console.error("Error en importación de docentes:", err);
      setError(err.message || "Error al procesar el archivo Excel.");
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
            <p className="text-sm font-bold text-slate-700 mb-2">Selecciona Excel de Docentes</p>
            <label className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:border-primary transition-colors">
              <Upload className="size-3" />
              Elegir archivo
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
            </label>
          </div>
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3">
        <UserPlus className="size-5 text-emerald-500 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-emerald-800">Mapeo de Importación</p>
          <p className="text-[10px] text-emerald-600 leading-relaxed uppercase">
            Columnas requeridas: <strong>Apellido</strong>, <strong>Nombre</strong>, <strong>NroDocumento</strong>, <strong>NroCuil</strong>.
            <br />
            Se creará automáticamente el tipo de entidad <strong>DOCENTE</strong>.
          </p>
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
            "Importar Docentes"
          )}
          {success ? "¡Completado!" : "Procesar Archivo"}
        </button>
      </div>
    </div>
  );
}
