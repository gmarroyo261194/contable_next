import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await (db as any).user.findUnique({ // eslint-disable-line @typescript-eslint/no-explicit-any
          where: { email: credentials.email as string },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            },
            empresas: {
              include: {
                empresa: true
              }
            }
          }
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        const permissions = user.roles.flatMap((ur: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
          ur.role.permissions.map((rp: any) => rp.permission.name) // eslint-disable-line @typescript-eslint/no-explicit-any
        );

        const primaryEmpresa = user.empresas[0]?.empresa;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles.map((ur: any) => ur.role.name), // eslint-disable-line @typescript-eslint/no-explicit-any
          permissions: Array.from(new Set(permissions)),
          empresaId: primaryEmpresa?.id,
          empresaNombre: primaryEmpresa?.nombre,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.permissions = (user as any).permissions; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.empresaId = (user as any).empresaId; // eslint-disable-line @typescript-eslint/no-explicit-any
        token.empresaNombre = (user as any).empresaNombre; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).roles = token.roles; // eslint-disable-line @typescript-eslint/no-explicit-any
        (session.user as any).permissions = token.permissions; // eslint-disable-line @typescript-eslint/no-explicit-any
        (session.user as any).empresaId = token.empresaId; // eslint-disable-line @typescript-eslint/no-explicit-any
        (session.user as any).empresaNombre = token.empresaNombre; // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
