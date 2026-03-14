"use client";

import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout 
      title="Iniciar Sesión" 
      subtitle="Bienvenido de nuevo a su panel contable"
    >
      <LoginForm />
    </AuthLayout>
  );
}
