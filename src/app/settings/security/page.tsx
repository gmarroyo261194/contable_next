import React from "react";
import { getUsers, getRoles, getPermissions } from "./actions";
import { SecurityClient } from "./SecurityClient";

export default async function SecurityPage() {
  const [users, roles, permissions] = await Promise.all([
    getUsers(),
    getRoles(),
    getPermissions(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <SecurityClient 
        users={users} 
        roles={roles} 
        permissions={permissions} 
      />
    </div>
  );
}
