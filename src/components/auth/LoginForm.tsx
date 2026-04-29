"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Building2, Calendar, Loader2 } from 'lucide-react';
import { login, getLoginData } from "@/lib/actions/auth-actions";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginData, setLoginData] = useState<any[]>([]);
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedEjercicio, setSelectedEjercicio] = useState<string>("");

  // Fetch companies when email changes (debounced)
  const fetchCompanies = useCallback(async (emailVal: string) => {
    if (!emailVal || !emailVal.includes('@')) {
      setLoginData([]);
      setSelectedEmpresa("");
      setSelectedEjercicio("");
      return;
    }

    setFetchingData(true);
    try {
      const data = await getLoginData(emailVal);
      if (data && data.length > 0) {
        setLoginData(data);
        // Default to first company and its first period if not already set or if different
        if (!selectedEmpresa || !data.find((e: any) => e.id.toString() === selectedEmpresa)) {
          setSelectedEmpresa(data[0].id.toString());
          if (data[0].ejercicios && data[0].ejercicios.length > 0) {
            setSelectedEjercicio(data[0].ejercicios[0].id.toString());
          }
        }
      } else {
        setLoginData([]);
        setSelectedEmpresa("");
        setSelectedEjercicio("");
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setFetchingData(false);
    }
  }, [selectedEmpresa]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies(email);
    }, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [email, fetchCompanies]);

  const currentEmpresaData = loginData.find(e => e.id.toString() === selectedEmpresa);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmpresa || !selectedEjercicio) {
      setError("Por favor, seleccione una empresa y ejercicio válidos.");
      return;
    }

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

  return (
    <form className="space-y-5 animate-in fade-in zoom-in-95 duration-500" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
      
      {/* Credentials */}
      <div className="space-y-5">
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Correo electrónico</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Mail className="size-4" />
            </div>
            <input 
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400" 
              placeholder="ejemplo@contablenext.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Lock className="size-4" />
            </div>
            <input 
              className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1" 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Integrated Selection */}
      <div className="space-y-5 pt-2">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Seleccionar Empresa</label>
            {fetchingData && <Loader2 className="size-3 animate-spin text-primary" />}
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
            <select 
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer disabled:opacity-50"
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
              disabled={fetchingData || loginData.length === 0}
            >
              {loginData.length > 0 ? (
                loginData.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))
              ) : (
                <option value="">{fetchingData ? "Buscando..." : "Ingrese su correo"}</option>
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Seleccionar Ejercicio</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Calendar className="size-4" />
            </div>
            <select 
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 appearance-none cursor-pointer disabled:opacity-50"
              value={selectedEjercicio}
              onChange={(e) => setSelectedEjercicio(e.target.value)}
              disabled={fetchingData || !currentEmpresaData || currentEmpresaData.ejercicios.length === 0}
            >
              {currentEmpresaData?.ejercicios.length > 0 ? (
                currentEmpresaData.ejercicios.map((ej: any) => (
                  <option key={ej.id} value={ej.id}>Ejercicio {ej.numero}</option>
                ))
              ) : (
                <option value="">{fetchingData ? "Cargando..." : "Sin ejercicios disponibles"}</option>
              )}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <button 
        className="w-full bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] mt-4" 
        type="submit"
        disabled={loading || fetchingData || loginData.length === 0}
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <LogIn className="size-5" />}
        Iniciar Sesión
      </button>
    </form>
  );
}
