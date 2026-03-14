"use client";

import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout 
      title="Crear Cuenta" 
      subtitle="Únete a ContableNext y gestiona tu contabilidad fácilmente"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
