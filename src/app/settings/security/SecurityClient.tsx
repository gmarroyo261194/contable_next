"use client";

import React from "react";
import { Plus, Pencil, Trash2, Shield, Users, Key, ArrowLeft } from "lucide-react";
import { DataGrid } from "@/components/ui/DataGrid";
import { Dialog } from "@/components/Dialog";
import { UserForm } from "@/components/security/UserForm";
import { RoleForm } from "@/components/security/RoleForm";
import { PermissionForm } from "@/components/security/PermissionForm";
import { deleteUser, deleteRole, deletePermission } from "@/app/settings/security/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SecurityClient({ users, roles, permissions }: any) {
  const [activeTab, setActiveTab] = React.useState("users");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const router = useRouter();

  const handleCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este elemento?")) return;
    
    try {
      if (activeTab === "users") await deleteUser(id);
      else if (activeTab === "roles") await deleteRole(id);
      else if (activeTab === "permissions") await deletePermission(id);
      router.refresh();
    } catch (e) {
      alert("Error al eliminar. Es posible que el elemento tenga dependencias.");
    }
  };

  const tabs = [
    { id: "users", label: "Usuarios", icon: Users },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "permissions", label: "Permisos", icon: Key },
  ];

  const userColumns = [
    { header: "Nombre", accessor: (u: any) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
          {u.name?.slice(0, 2)}
        </div>
        <span className="font-bold text-slate-800">{u.name}</span>
      </div>
    )},
    { header: "Email", accessor: "email" },
    { header: "Roles", accessor: (u: any) => (
      <div className="flex flex-wrap gap-1">
        {u.roles.map((ur: any) => (
          <span key={ur.roleId} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
            {ur.role.name}
          </span>
        ))}
      </div>
    )},
  ];

  const roleColumns = [
    { header: "Nombre", accessor: "name", className: "font-bold text-slate-800" },
    { header: "Descripción", accessor: "description" },
    { header: "Permisos", accessor: (r: any) => (
      <span className="text-xs font-medium text-slate-500">
        {r.permissions.length} permisos asignados
      </span>
    )},
  ];

  const permissionColumns = [
    { header: "Identificador", accessor: "name", className: "font-mono text-xs font-bold text-primary" },
    { header: "Descripción", accessor: "description" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 text-center">
          <Link href="/settings" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group">
            <ArrowLeft className="size-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-slate-800 font-display text-left">Seguridad</h2>
            <p className="text-slate-500 text-sm">Gestiona usuarios, roles y permisos del sistema</p>
          </div>
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-slate-100 w-fit rounded-2xl border border-slate-200/60">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === "users" && (
          <DataGrid
            title="Listado de Usuarios"
            description="Todos los usuarios registrados con acceso al panel"
            data={users}
            columns={userColumns}
            onCreate={handleCreate}
            createLabel="Nuevo Usuario"
            actions={(item) => (
              <>
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          />
        )}

        {activeTab === "roles" && (
          <DataGrid
            title="Roles de Usuario"
            description="Define grupos de permisos para asignar a los usuarios"
            data={roles}
            columns={roleColumns}
            onCreate={handleCreate}
            createLabel="Nuevo Rol"
            actions={(item) => (
              <>
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          />
        )}

        {activeTab === "permissions" && (
          <DataGrid
            title="Permisos del Sistema"
            description="Permisos granulares que pueden ser asignados a los roles"
            data={permissions}
            columns={permissionColumns}
            onCreate={handleCreate}
            createLabel="Nuevo Permiso"
            actions={(item) => (
              <>
                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          />
        )}
      </div>

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title={editingItem ? "Editar" : "Nuevo"}
      >
        {activeTab === "users" && (
          <UserForm 
            initialData={editingItem} 
            availableRoles={roles} 
            onClose={() => setIsDialogOpen(false)} 
            onSuccess={() => router.refresh()} 
          />
        )}
        {activeTab === "roles" && (
          <RoleForm 
            initialData={editingItem} 
            availablePermissions={permissions} 
            onClose={() => setIsDialogOpen(false)} 
            onSuccess={() => router.refresh()} 
          />
        )}
        {activeTab === "permissions" && (
          <PermissionForm 
            initialData={editingItem} 
            onClose={() => setIsDialogOpen(false)} 
            onSuccess={() => router.refresh()} 
          />
        )}
      </Dialog>
    </div>
  );
}
