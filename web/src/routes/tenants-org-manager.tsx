import { useEffect, useMemo, useState, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Trash2,
  Loader2,
  Mail,
  Shield,
  LayoutGrid,
  List,
  X,
  User,
  AtSign,
  Check,
  Upload,
} from "lucide-react";
import "../css/liquidGlass.css";

export const Route = createFileRoute("/tenants-org-manager")({
  component: UsersManagement,
});

const API_BASE = import.meta.env.VITE_API_URL;

interface UserRecord {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isOrgManager?: boolean;
  is_org_manager?: boolean;
}

interface Group {
  id?: string;
  name?: string;
}

interface BulkUser {
  username: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
  status: string;
}

type CreateUserField = "name" | "email" | "username" | "role" | "group" | null;

function mapRole(
  value: string | undefined
): "ORG_MANAGER" | "DEFAULT_USER" | "" {
  const v = (value || "").trim().toLowerCase();
  if (
    ["org_manager", "org manager", "organization manager", "org"].includes(v)
  )
    return "ORG_MANAGER";
  if (["default_user", "default user", "user", "default"].includes(v))
    return "DEFAULT_USER";
  return "";
}

function UsersManagement() {
  const { keycloak } = useKeycloak();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");

  // New User Modal State
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserRole, setNewUserRole] = useState<
    "ORG_MANAGER" | "DEFAULT_USER" | ""
  >("");
  const [newUserGroupId, setNewUserGroupId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [createFieldError, setCreateFieldError] = useState<CreateUserField>(null);

  // Bulk Import State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const roleFirstOptionRef = useRef<HTMLButtonElement>(null);
  const groupSelectRef = useRef<HTMLSelectElement>(null);

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

  useEffect(() => {
    if (createStatus?.type !== "error" || !createFieldError) return;

    let target: HTMLElement | null;
    switch (createFieldError) {
      case "name":
        target = nameInputRef.current;
        break;
      case "email":
        target = emailInputRef.current;
        break;
      case "username":
        target = usernameInputRef.current;
        break;
      case "role":
        target = roleFirstOptionRef.current;
        break;
      case "group":
        target = groupSelectRef.current;
        break;
      default:
        target = null;
    }

    target?.focus();
  }, [createStatus, createFieldError]);



  const handleDeleteUser = async (id: string) => {
    if (!id || !realm) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
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
      // Remove user from local state instead of refetching
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

  const handleCreateUser = async () => {
    if (!realm) {
      setCreateStatus({ type: "error", message: "Realm not resolved." });
      setCreateFieldError(null);
      return;
    }
    if (!newUserName) {
      setCreateStatus({ type: "error", message: "Name is required." });
      setCreateFieldError("name");
      return;
    }
    if (!newUserEmail) {
      setCreateStatus({ type: "error", message: "Email is required." });
      setCreateFieldError("email");
      return;
    }
    if (!newUserRole) {
      setCreateStatus({ type: "error", message: "Role is required." });
      setCreateFieldError("role");
      return;
    }

    setIsCreating(true);
    setCreateStatus(null);
    setCreateFieldError(null);

    try {
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(realm)}/users`,
        {
          method: "POST",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: newUserUsername || newUserEmail.split("@")[0],
            name: newUserName,
            email: newUserEmail,
            role: newUserRole,
            group_id: newUserGroupId || undefined,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to create user`);
      }

      const data = await res.json();
      toast.success(
        `User created! Temporary password: ${data?.temporary_password ?? "N/A"}`,
        { position: "top-right" }
      );

      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserUsername("");
      setNewUserRole("");
      setNewUserGroupId("");
      setCreateStatus(null);
      setShowNewUserModal(false);
      fetchUsers(realm);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create user";
      const lowerError = errorMessage.toLowerCase();
      let errorField: CreateUserField = null;
      if (lowerError.includes("email")) errorField = "email";
      else if (lowerError.includes("username")) errorField = "username";
      else if (lowerError.includes("role")) errorField = "role";
      else if (lowerError.includes("group")) errorField = "group";
      else if (lowerError.includes("name")) errorField = "name";

      setCreateFieldError(errorField);
      setCreateStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsCreating(false);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkCreate = async () => {
    if (!realm) return;
    setIsBulkLoading(true);
    const updated = [...bulkUsers];

    // Build group map and ensure groups exist up front
    const groupNames = new Set<string>();
    bulkUsers.forEach((u) => {
      if (u.groups && Array.isArray(u.groups)) {
        u.groups.filter(Boolean).forEach((g) => groupNames.add(g.trim()));
      } else if (typeof (u as any).groups === "string") {
        (u as any).groups
          .split(",")
          .map((g: string) => g.trim())
          .filter(Boolean)
          .forEach((g: string) => groupNames.add(g));
      }
    });

    const groupIdMap: Record<string, string> = {};
    const fetchGroups = async () => {
      try {
        const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(realm)}/groups`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        (data.groups || []).forEach((g: any) => {
          if (g.name && g.id) groupIdMap[g.name] = g.id;
        });
      } catch {
        /* ignore */
      }
    };

    // initial groups
    await fetchGroups();
    // create missing groups
    for (const name of groupNames) {
      if (groupIdMap[name]) continue;
      try {
        const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(realm)}/groups`, {
          method: "POST",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
        if (res.ok) {
          await fetchGroups();
        }
      } catch {
        // skip failures; creation will still proceed
      }
    }

    // track created users for later group assignment
    const createdUsers: { email: string; groups: string[] }[] = [];

    for (let i = 0; i < updated.length; i++) {
      const u = updated[i];
      if (!u.username || !u.name || !u.email || !u.role) {
        updated[i] = { ...u, status: "missing fields" };
        continue;
      }
      try {
        const res = await fetch(
          `${API_BASE}/org-manager/${encodeURIComponent(realm)}/users`,
          {
            method: "POST",
            headers: {
              Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: u.username,
              name: u.name,
              email: u.email,
              role: u.role,
            }),
          }
        );
        if (!res.ok) {
          updated[i] = { ...u, status: `error ${res.status}` };
          continue;
        }
        const data = await res.json();
        updated[i] = {
          ...u,
          status: `created (pwd: ${data?.temporary_password ?? "N/A"})`,
        };
        const userGroups =
          Array.isArray(u.groups) && u.groups.length
            ? u.groups
            : typeof (u as any).groups === "string"
              ? (u as any).groups
                .split(",")
                .map((g: string) => g.trim())
                .filter(Boolean)
              : [];
        if (userGroups.length) {
          createdUsers.push({ email: u.email, groups: userGroups });
        }
      } catch {
        updated[i] = { ...u, status: "error" };
      }
    }

    // Fetch users to map email -> id, then add to groups
    try {
      const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(realm)}/users`, {
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const userMap: Record<string, string> = {};
        (data.users || []).forEach((usr: any) => {
          if (usr.email && usr.id) userMap[usr.email.toLowerCase()] = usr.id;
        });
        for (const entry of createdUsers) {
          const uid = userMap[entry.email.toLowerCase()];
          if (!uid) continue;
          for (const gName of entry.groups) {
            const gid = groupIdMap[gName];
            if (!gid) continue;
            try {
              await fetch(
                `${API_BASE}/org-manager/${encodeURIComponent(realm)}/groups/${encodeURIComponent(gid)}/members/${encodeURIComponent(uid)}`,
                {
                  method: "POST",
                  headers: {
                    Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
                  },
                }
              );
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch {
      /* ignore */
    }

    setBulkUsers(updated);
    setIsBulkLoading(false);
    fetchUsers(realm);
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

  const getRoleBadge = (user: UserRecord) => {
    const isOrgManager = user.isOrgManager ?? user.is_org_manager ?? false;
    if (isOrgManager) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
          <Shield size={12} />
          Org Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
        User
      </span>
    );
  };

  const roleOptions: Array<{
    value: "ORG_MANAGER" | "DEFAULT_USER";
    label: string;
  }> = [
    { value: "ORG_MANAGER", label: "Organization Manager" },
    { value: "DEFAULT_USER", label: "User" },
  ];

  const getRoleOptionClass = (value: "ORG_MANAGER" | "DEFAULT_USER"): string => {
    if (newUserRole === value) {
      return "bg-purple-100 border-2 border-purple-400";
    }
    if (createFieldError === "role") {
      return "bg-rose-50 border border-rose-300 hover:bg-rose-100/70";
    }
    return "bg-gray-50 border border-gray-200 hover:bg-gray-100";
  };

  return (
    <div className="h-full w-full flex flex-col animate-fade-in">
      {/* Header - matching user groups style */}
      <div className="h-16 lg:h-20 w-full flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 border-b border-gray-200 flex-shrink-0">
        {/* Title */}
        <div className="flex-shrink-0">
          <h1 className="font-bold text-base sm:text-lg lg:text-xl text-gray-900">
            User Management
          </h1>
        </div>

        {/* Right side - Search, View Toggle, Buttons */}
        <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* View Toggle - Hidden on mobile */}
          <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-md transition-colors ${view === "table"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                } cursor-pointer`}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors ${view === "grid"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
                } cursor-pointer`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Hidden file input for bulk import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleCsvUpload(file);
                setShowBulkModal(true);
              }
              e.target.value = ""; // Reset so same file can be selected again
            }}
          />

          {/* Bulk Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden lg:inline">Bulk Import</span>
          </button>

          {/* Create Button */}
          <button
            onClick={() => setShowNewUserModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>




      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 purple-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-500">Loading users...</span>
          </div>
        ) : !realm ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">
              Resolving realm from token...
            </span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-[15px]">
              {searchQuery ? "No users match your search" : "No users found"}
            </p>
          </div>
        ) : view === "table" ? (
          <div className="liquid-glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/60">
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-right px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/60">
                {filteredUsers.map((user) => {
                  const id = user.id || user.username || "";
                  const isOrgManager =
                    user.isOrgManager ?? user.is_org_manager ?? false;
                  const isDeleting = deletingIds[id] || false;
                  const fullName =
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.username;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                            {(
                              user.firstName?.[0] ||
                              user.username?.[0] ||
                              "U"
                            ).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[14px] text-gray-900">
                              {fullName}
                            </p>
                            <p className="text-[12px] text-gray-500">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[14px] text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          {user.email || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user)}</td>
                      <td className="px-6 py-4 text-right">
                        {!isOrgManager && (
                          <button
                            onClick={() => handleDeleteUser(id)}
                            disabled={isDeleting}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map((user) => {
              const id = user.id || user.username || "";
              const isOrgManager =
                user.isOrgManager ?? user.is_org_manager ?? false;
              const isDeleting = deletingIds[id] || false;
              const fullName =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                user.username;

              return (
                <div
                  key={id}
                  className="liquid-glass-card p-5 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {(
                        user.firstName?.[0] ||
                        user.username?.[0] ||
                        "U"
                      ).toUpperCase()}
                    </div>
                    {!isOrgManager && (
                      <button
                        onClick={() => handleDeleteUser(id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <h3 className="font-semibold text-[15px] text-gray-900 truncate">
                    {fullName}
                  </h3>
                  <p className="text-[13px] text-gray-500 truncate">
                    @{user.username}
                  </p>
                  <p className="text-[12px] text-gray-400 truncate mt-1 flex items-center gap-1">
                    <Mail size={12} />
                    {user.email || "—"}
                  </p>
                  <div className="mt-3">{getRoleBadge(user)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Create New User
                </h2>
                <p className="text-sm text-gray-500">
                  Add a new user to your organization
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewUserModal(false);
                  setCreateStatus(null);
                  setCreateFieldError(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Full Name */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={newUserName}
                    onChange={(e) => {
                      setNewUserName(e.target.value);
                      if (createFieldError === "name") {
                        setCreateFieldError(null);
                        setCreateStatus(null);
                      }
                    }}
                    placeholder="John Doe"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 text-[14px] placeholder:text-gray-400 focus:outline-none transition-all ${
                      createFieldError === "name"
                        ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                        : "border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                    }`}
                  />
                </div>
                {createStatus?.type === "error" && createFieldError === "name" && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {createStatus.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => {
                      setNewUserEmail(e.target.value);
                      if (createFieldError === "email") {
                        setCreateFieldError(null);
                        setCreateStatus(null);
                      }
                    }}
                    placeholder="john.doe@example.com"
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 text-[14px] placeholder:text-gray-400 focus:outline-none transition-all ${
                      createFieldError === "email"
                        ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                        : "border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                    }`}
                  />
                </div>
                {createStatus?.type === "error" && createFieldError === "email" && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {createStatus.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <AtSign
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={newUserUsername}
                    onChange={(e) => {
                      setNewUserUsername(e.target.value);
                      if (createFieldError === "username") {
                        setCreateFieldError(null);
                        setCreateStatus(null);
                      }
                    }}
                    placeholder="Username"
                    maxLength={40}
                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-gray-50 text-[14px] placeholder:text-gray-400 focus:outline-none transition-all ${
                      createFieldError === "username"
                        ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                        : "border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                    }`}
                  />
                </div>
                {createStatus?.type === "error" && createFieldError === "username" && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {createStatus.message}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Role <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-2">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      ref={option.value === "ORG_MANAGER" ? roleFirstOptionRef : undefined}
                      type="button"
                      onClick={() =>
                        setNewUserRole(option.value)
                      }
                      onFocus={() => {
                        if (createFieldError === "role") {
                          setCreateFieldError(null);
                          setCreateStatus(null);
                        }
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 flex items-center justify-between ${getRoleOptionClass(option.value)} cursor-pointer`}
                    >
                      <span
                        className={`font-medium text-[14px] ${newUserRole === option.value ? "text-purple-700" : "text-gray-700"}`}
                      >
                        {option.label}
                      </span>
                      {newUserRole === option.value && (
                        <Check size={18} className="text-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
                {createStatus?.type === "error" && createFieldError === "role" && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {createStatus.message}
                  </p>
                )}
              </div>

              {/* Group */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                  Group (Optional)
                </label>
                <select
                  ref={groupSelectRef}
                  value={newUserGroupId}
                  onChange={(e) => {
                    setNewUserGroupId(e.target.value);
                    if (createFieldError === "group") {
                      setCreateFieldError(null);
                      setCreateStatus(null);
                    }
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 text-[14px] focus:outline-none transition-all ${
                    createFieldError === "group"
                      ? "border border-rose-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400"
                      : "border border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                  }`}
                >
                  <option value="">No group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id || ""}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {createStatus?.type === "error" && createFieldError === "group" && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {createStatus.message}
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
              <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewUserModal(false);
                  setCreateStatus(null);
                  setCreateFieldError(null);
                }}
                className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={
                  !newUserName || !newUserEmail || !newUserRole || isCreating
                }
                className="px-6 py-2.5 rounded-xl text-[14px] font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create User"
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && bulkUsers.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bulk Import Users
                </h2>
                <p className="text-sm text-gray-500">
                  {bulkUsers.length} users imported from CSV
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkUsers([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Username</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Groups</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkUsers.map((u, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-900">{u.username}</td>
                      <td className="py-3 text-gray-700">{u.name}</td>
                      <td className="py-3 text-gray-600">{u.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          {u.role || "—"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600">
                        {u.groups && u.groups.length
                          ? u.groups.join(", ")
                          : (u as any).groups || "—"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-xs ${u.status.includes("created")
                            ? "text-green-600"
                            : u.status.includes("error")
                              ? "text-rose-600"
                              : "text-gray-400"
                            }`}
                        >
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkUsers([]);
                }}
                className="px-5 py-2.5 rounded-lg text-[14px] font-medium text-gray-600 bg-white hover:bg-gray-100 transition-all border border-gray-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await handleBulkCreate();
                }}
                disabled={isBulkLoading || bulkUsers.every((u) => u.status !== "pending")}
                className="px-6 py-2.5 rounded-xl text-[14px] font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
              >
                {isBulkLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </span>
                ) : (
                  `Create ${bulkUsers.filter((u) => u.status === "pending").length} Users`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
