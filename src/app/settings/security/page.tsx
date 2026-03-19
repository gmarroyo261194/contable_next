import React from "react";
import { getUsers, getRoles, getPermissions, getEmpresas } from "./actions";
import { SecurityClient } from "./SecurityClient";

export default async function SecurityPage() {
  const [users, roles, permissions, empresas] = await Promise.all([
    getUsers(),
    getRoles(),
    getPermissions(),
    getEmpresas(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <SecurityClient 
        users={users} 
        roles={roles} 
        permissions={permissions} 
        empresas={empresas}
      />
    </div>
  );
}
