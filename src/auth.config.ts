import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await (db as any).user.findUnique({
          where: { email: credentials.email as string },
          include: {
            roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
            empresas: { include: { empresa: true } }
          }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        const permissions = user.roles.flatMap((ur: any) =>
          ur.role.permissions.map((rp: any) => rp.permission.name)
        );

        const selectedEmpresaId = credentials.empresaId ? parseInt(credentials.empresaId as string) : null;
        const selectedEjercicioId = credentials.ejercicioId ? parseInt(credentials.ejercicioId as string) : null;

        let activeEmpresa = user.empresas[0]?.empresa;
        if (selectedEmpresaId) {
          const ue = user.empresas.find((e: any) => e.empresaId === selectedEmpresaId);
          if (ue) activeEmpresa = ue.empresa;
        }

        let finalEjercicioId = selectedEjercicioId;
        let activeEjercicioNombre = "";

        if (activeEmpresa) {
          if (finalEjercicioId) {
            const ej = await (db as any).ejercicio.findUnique({ where: { id: finalEjercicioId } });
            if (ej) activeEjercicioNombre = ej.numero.toString();
          } else {
            // Auto-seleccionar el primer ejercicio abierto de la empresa
            const firstEj = await (db as any).ejercicio.findFirst({
              where: { empresaId: activeEmpresa.id, cerrado: false },
              orderBy: { inicio: 'desc' }
            });
            if (firstEj) {
              finalEjercicioId = firstEj.id;
              activeEjercicioNombre = firstEj.numero.toString();
            }
          }
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles.map((ur: any) => ur.role.name),
          permissions: Array.from(new Set(permissions)),
          empresaId: activeEmpresa?.id,
          empresaNombre: activeEmpresa?.nombre,
          ejercicioId: finalEjercicioId,
          ejercicioNombre: activeEjercicioNombre,
        };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = nextUrl.pathname === "/" || nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      const isSetupPage = nextUrl.pathname === "/setup";
      const hasEmpresa = !!(auth?.user as any)?.empresaId;
      
      if (!isLoggedIn && !isPublicPage) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (isLoggedIn && !hasEmpresa && !isSetupPage && !isPublicPage) {
        return Response.redirect(new URL("/setup", nextUrl));
      }

      if (isLoggedIn && hasEmpresa && isSetupPage) {
        return Response.redirect(new URL("/", nextUrl));
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.permissions = (user as any).permissions; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.empresaId = (user as any).empresaId;
        token.empresaNombre = (user as any).empresaNombre;
        token.ejercicioId = (user as any).ejercicioId;
        token.ejercicioNombre = (user as any).ejercicioNombre;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).roles = token.roles;
        (session.user as any).permissions = token.permissions;
        (session.user as any).empresaId = token.empresaId;
        (session.user as any).empresaNombre = token.empresaNombre;
        (session.user as any).ejercicioId = token.ejercicioId;
        (session.user as any).ejercicioNombre = token.ejercicioNombre;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
