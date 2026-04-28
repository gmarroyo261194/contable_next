"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

/**
 * Proveedor de tema para la aplicación.
 * Permite el cambio entre temas claro y oscuro.
 * 
 * @param {ThemeProviderProps} props - Propiedades del proveedor de tema.
 * @returns {JSX.Element} Componente con el contexto de tema.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
