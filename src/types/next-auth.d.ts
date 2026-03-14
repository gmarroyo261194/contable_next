import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles?: string[];
      permissions?: string[];
      empresaId?: number;
      empresaNombre?: string;
    } & DefaultSession["user"];
  }

  interface User {
    roles?: string[];
    permissions?: string[];
    empresaId?: number;
    empresaNombre?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles?: string[];
    permissions?: string[];
    empresaId?: number;
    empresaNombre?: string;
  }
}
