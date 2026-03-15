import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import AuthProvider from "@/components/providers/SessionProvider";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ContableNext - Software Contable",
  description: "Sistema de gestión contable moderno",
};

import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthenticated = !!session;

  return (
    <html lang="es" className={`${inter.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50">
        <Toaster position="top-right" richColors />
        <AuthProvider>
          {isAuthenticated ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </div>
          ) : (
            <main className="min-h-screen">
              {children}
            </main>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
