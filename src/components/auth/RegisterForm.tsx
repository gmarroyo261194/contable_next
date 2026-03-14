import React, { useState } from 'react';
import { Mail, Lock, User, Briefcase, CheckCircle, Hash } from 'lucide-react';
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
      // Success is handled by redirect in register action
    } catch (err) {
      setError("Algo salió mal. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre completo</label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="Ej. Juan Pérez"
              name="name"
              type="text"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
              placeholder="correo@ejemplo.com"
              name="email"
              type="email"
              required
            />
          </div>
        </div>

        {/* Company and CUIT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Empresa</label>
            <div className="relative group">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="Nombre de tu empresa"
                name="company"
                type="text"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">CUIT</label>
            <div className="relative group">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="20-12345678-9"
                name="cuit"
                type="text"
                required
              />
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
                name="password"
                type="password"
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar</label>
            <div className="relative group">
              <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-[#ec5b13] transition-colors" />
              <input
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#ec5b13]/20 focus:border-[#ec5b13] outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                placeholder="••••••••"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      {/* <div className="flex items-start gap-3 py-2">
        <input 
          className="mt-1 size-4 rounded text-[#ec5b13] focus:ring-[#ec5b13] border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer" 
          id="terms" 
          type="checkbox"
          required
        />
        <label className="text-sm text-slate-500 dark:text-slate-400 leading-tight cursor-pointer" htmlFor="terms">
          Acepto los <a className="text-[#ec5b13] font-medium hover:underline" href="#">términos y condiciones</a> y la <a className="text-[#ec5b13] font-medium hover:underline" href="#">política de privacidad</a>.
        </label>
      </div> */}

      {/* Submit Button */}
      <button
        className="w-full py-4 bg-[#ec5b13] hover:bg-[#ec5b13]/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ec5b13]/25 active:scale-[0.98] disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? "Creando Cuenta..." : "Crear Cuenta"}
      </button>

      {/* <div className="mt-6 flex flex-col gap-4 text-center">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">O continúa con</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" type="button">
            <div className="size-5 bg-slate-100 rounded-sm"></div>
            <span className="text-xs font-semibold">Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" type="button">
            <div className="size-5 bg-slate-100 rounded-sm"></div>
            <span className="text-xs font-semibold">Microsoft</span>
          </button>
        </div>
      </div> */}
    </form>
  );
}
