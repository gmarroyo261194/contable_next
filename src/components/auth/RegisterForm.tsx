import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, CheckCircle, Hash, Loader2 } from 'lucide-react';
import { register } from "@/lib/actions/auth-actions";

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError("Algo salió mal. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-500" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nombre completo</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <User className="size-4" />
            </div>
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
              placeholder="Ej. Juan Pérez"
              name="name"
              type="text"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2.5">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Correo electrónico</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
              <Mail className="size-4" />
            </div>
            <input
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
              placeholder="correo@ejemplo.com"
              name="email"
              type="email"
              required
            />
          </div>
        </div>

        {/* Company and CUIT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Empresa</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
                <Briefcase className="size-4" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                placeholder="Nombre de tu empresa"
                name="company"
                type="text"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">CUIT</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
                <Hash className="size-4" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                placeholder="20-12345678-9"
                name="cuit"
                type="text"
                required
              />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
                <Lock className="size-4" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
                name="password"
                type="password"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-primary transition-colors flex items-center justify-center">
                <CheckCircle className="size-4" />
              </div>
              <input
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] mt-4"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : null}
        {loading ? "Creando Cuenta..." : "Crear Cuenta"}
      </button>
    </form>
  );
}
