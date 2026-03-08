import { useEffect, useMemo, useState, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Loader2 } from "lucide-react";
import "../css/liquidGlass.css";

import type { UserRecord, Group, BulkUser } from "../components/admin/tenant-org-manager/types";
import { UserTable } from "../components/admin/tenant-org-manager/UserTable";
import { UserGrid } from "../components/admin/tenant-org-manager/UserGrid";
import { UserManagementHeader } from "../components/admin/tenant-org-manager/UserManagementHeader";
import { NewUserModal } from "../components/admin/tenant-org-manager/NewUserModal";
import { BulkImportModal } from "../components/admin/tenant-org-manager/BulkImportModal";
import { mapRole } from "../components/admin/tenant-org-manager/utils";

export const Route = createFileRoute("/tenants-org-manager")({
  component: UsersManagement,
});

const API_BASE = import.meta.env.VITE_API_URL;

function UsersManagement() {
  const { keycloak } = useKeycloak();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");

  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tokenRealm = useMemo(() => {
    const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
  }, [keycloak.tokenParsed]);

  const realm = tokenRealm || "";

  const fetchUsers = async (targetRealm: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users`,
        {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async (targetRealm: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/groups`,
        {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    if (realm) {
      fetchUsers(realm);
      fetchGroups(realm);
    }
  }, [realm]);

  const handleDeleteUser = async (id: string) => {
    if (!id || !realm) return;
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(realm)}/users/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers((prev) => prev.filter((u) => (u.id || u.username) !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
    } finally {
      setDeletingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleCsvUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/org-manager/upload`, {
        method: "POST",
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload CSV");
      const data = await res.json();
      const rows = (data as any[]).map((row) => ({
        username: row.username || "",
        name: row.name || "",
        email: row.email || "",
        role: mapRole(row.role),
        groups:
          typeof row.groups === "string"
            ? row.groups
              .split(",")
              .map((g: string) => g.trim())
              .filter(Boolean)
            : [],
        status: "pending",
      }));
      setBulkUsers(rows);
      setShowBulkModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full w-full flex flex-col animate-fade-in">
      <UserManagementHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        view={view}
        setView={setView}
        fileInputRef={fileInputRef}
        onNewUser={() => setShowNewUserModal(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCsvUpload(file);
          e.target.value = "";
        }}
      />

      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-6 purple-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Loading users...</span>
          </div>
        ) : !realm ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Resolving realm...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-[15px]">
              {searchQuery ? "No users match search" : "No users found"}
            </p>
          </div>
        ) : view === "table" ? (
          <UserTable
            users={filteredUsers}
            deletingIds={deletingIds}
            onDeleteUser={handleDeleteUser}
          />
        ) : (
          <UserGrid
            users={filteredUsers}
            deletingIds={deletingIds}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </div>

      {showNewUserModal && (
        <NewUserModal
          realm={realm}
          groups={groups}
          onClose={() => setShowNewUserModal(false)}
          onUserCreated={() => realm && fetchUsers(realm)}
        />
      )}

      {showBulkModal && bulkUsers.length > 0 && (
        <BulkImportModal
          realm={realm}
          initialBulkUsers={bulkUsers}
          onClose={() => {
            setShowBulkModal(false);
            setBulkUsers([]);
          }}
          onBulkCreated={() => realm && fetchUsers(realm)}
        />
      )}
    </div>
  );
}
