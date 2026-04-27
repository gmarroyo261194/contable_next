import React from "react";
import AuditLogsClient from "./AuditLogsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auditoría | ContableNext",
  description: "Historial de cambios y trazabilidad del sistema",
};

export default function AuditLogsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AuditLogsClient />
    </div>
  );
}
