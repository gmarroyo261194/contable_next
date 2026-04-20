"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";
import { getDefaultEjercicio } from "@/lib/actions/sync-facturas-actions";

export function StoreInitializer() {
  const { data: session } = useSession();
  const { empresaId, ejercicioId, setEmpresa, setEjercicio } = useAppStore();

  useEffect(() => {
    const initialize = async () => {
      if (session?.user) {
        const s = session.user as any;
        const currentEmpresaId = s.empresaId;
        
        if (currentEmpresaId && !empresaId) {
          setEmpresa(currentEmpresaId);
        }

        if (s.ejercicioId) {
          if (!ejercicioId) setEjercicio(s.ejercicioId);
        } else if (currentEmpresaId && !ejercicioId) {
          // Si la sesión no lo tiene (ej. recién creado en setup), buscar en DB
          const defaultId = await getDefaultEjercicio(currentEmpresaId);
          if (defaultId) setEjercicio(defaultId);
        }
      }
    };

    initialize();
  }, [session, empresaId, ejercicioId, setEmpresa, setEjercicio]);

  return null;
}
