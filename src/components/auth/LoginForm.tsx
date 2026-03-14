import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { login } from "@/lib/actions/auth-actions";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await login(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // If successful, NextAuth handles the redirect via redirectTo in signIn
    } catch {
      setError("Algo salió mal. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
        <div className="relative group">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/50 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white" 
            placeholder="ejemplo@contablenext.com" 
            name="email"
            type="email"
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
          <a className="text-xs font-semibold text-[#ec5b13] hover:underline" href="#">¿Olvidaste tu contraseña?</a>
        </div>
        <div className="relative group">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
          <input 
            className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/50 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white" 
            placeholder="••••••••" 
            name="password"
            type={showPassword ? "text" : "password"}
            required
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input 
          className="w-4 h-4 rounded border-slate-300 text-[#ec5b13] focus:ring-[#ec5b13]" 
          id="remember" 
          type="checkbox"
        />
        <label className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer" htmlFor="remember">
          Recordarme en este dispositivo
        </label>
      </div>

      <button 
        className="w-full bg-[#ec5b13] hover:bg-[#ec5b13]/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-[#ec5b13]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2" 
        type="submit"
        disabled={loading}
      >
        <LogIn className="size-5" />
        {loading ? "Cargando..." : "Entrar al Panel"}
      </button>
    </form>
  );
}
