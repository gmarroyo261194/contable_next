"use client";

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Building2, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { login, getLoginData } from "@/lib/actions/auth-actions";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [step, setStep] = useState(1); // 1: Credentials, 2: Selection
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginData, setLoginData] = useState<any[]>([]);
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedEjercicio, setSelectedEjercicio] = useState<string>("");

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // In a real app, you might want to validate password here too before showing companies
      // For this implementation, we fetch the companies associated with the email
      const data = await getLoginData(email);
      if (!data || data.length === 0) {
        setError("No se encontraron empresas asociadas a este correo.");
        setLoading(false);
        return;
      }

      setLoginData(data);
      setSelectedEmpresa(data[0].id.toString());
      if (data[0].ejercicios.length > 0) {
        setSelectedEjercicio(data[0].ejercicios[0].id.toString());
      }
      setStep(2);
    } catch (err) {
      setError("Error al verificar la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  const currentEmpresaData = loginData.find(e => e.id.toString() === selectedEmpresa);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("empresaId", selectedEmpresa);
    formData.append("ejercicioId", selectedEjercicio);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <form className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleSubmit}>
        <div className="text-center space-y-2 mb-4">
          <p className="text-sm text-slate-500">Bienvenido de nuevo</p>
          <p className="font-bold text-slate-800">{email}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Seleccionar Empresa</label>
            <div className="relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 appearance-none cursor-pointer"
                value={selectedEmpresa}
                onChange={(e) => {
                  const empId = e.target.value;
                  setSelectedEmpresa(empId);
                  const emp = loginData.find(d => d.id.toString() === empId);
                  if (emp && emp.ejercicios.length > 0) {
                    setSelectedEjercicio(emp.ejercicios[0].id.toString());
                  } else {
                    setSelectedEjercicio("");
                  }
                }}
              >
                {loginData.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Seleccionar Ejercicio</label>
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900 appearance-none cursor-pointer"
                value={selectedEjercicio}
                onChange={(e) => setSelectedEjercicio(e.target.value)}
                disabled={!currentEmpresaData || currentEmpresaData.ejercicios.length === 0}
              >
                {currentEmpresaData?.ejercicios.length > 0 ? (
                  currentEmpresaData.ejercicios.map((ej: any) => (
                    <option key={ej.id} value={ej.id}>Ejercicio {ej.numero}</option>
                  ))
                ) : (
                  <option value="">No hay ejercicios abiertos</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2" 
            type="submit"
            disabled={loading || !selectedEmpresa}
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
            Entrar al Panel
          </button>
          <button 
            type="button" 
            onClick={() => setStep(1)}
            className="text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Volver
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300" onSubmit={handleNextStep}>
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-600 text-sm font-medium">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Correo electrónico</label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900" 
            placeholder="ejemplo@contablenext.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Contraseña</label>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-slate-900" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            required
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <button 
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2" 
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <ArrowRight className="size-5" />}
        Continuar
      </button>
    </form>
  );
}
