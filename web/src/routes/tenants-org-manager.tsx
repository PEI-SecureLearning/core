import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { createFileRoute } from "@tanstack/react-router";
import UsersList from "@/components/tenants/UsersList";
import AddUserForm from "@/components/tenants/AddUserForm";
import BulkUserImport from "@/components/tenants/BulkUserImport";
import type { BulkUser, UserRecord } from "@/components/tenants/types";
import "../css/liquidGlass.css";

export const Route = createFileRoute("/tenants-org-manager")({
  component: TenantOrgManager,
});

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function extractRealmFromToken(iss?: string) {
  if (!iss) return null;
  const parts = iss.split("/realms/");
  return parts[1] ?? null;
}

function extractDomainFromClaims(claims?: { email?: string; preferred_username?: string }) {
  const candidate = claims?.email || claims?.preferred_username;
  if (!candidate || !candidate.includes("@")) return null;
  return candidate.split("@")[1];
}

function TenantOrgManager() {
  const { keycloak } = useKeycloak();
  const [realm, setRealm] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [bulkUsers, setBulkUsers] = useState<BulkUser[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [groups, setGroups] = useState<{ id?: string; name?: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const tokenRealm = useMemo(
    () => extractRealmFromToken((keycloak.tokenParsed as { iss?: string } | undefined)?.iss),
    [keycloak.tokenParsed]
  );
  const tokenDomain = useMemo(
    () => {
      // Try access token first, then ID token in case email is only there.
      const fromAccess = extractDomainFromClaims(
        keycloak.tokenParsed as { email?: string; preferred_username?: string } | undefined
      );
      if (fromAccess) return fromAccess;
      return extractDomainFromClaims(
        keycloak.idTokenParsed as { email?: string; preferred_username?: string } | undefined
      );
    },
    [keycloak.tokenParsed, keycloak.idTokenParsed]
  );

  useEffect(() => {
    // If we already know the realm from the token, prime the UI so the form is usable.
    if (tokenRealm && !realm) {
      setRealm(tokenRealm);
    }
  }, [tokenRealm, realm]);

  useEffect(() => {
    // On mount/when token changes, auto-lookup realm using the org manager's email domain.
    const doLookup = async () => {
      // If token already has the realm, don't override it with domain lookup.
      if (tokenRealm) return;
      if (!tokenDomain || !keycloak.authenticated) return;
      setStatus("Detecting realm from your domain...");
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/realms?domain=${encodeURIComponent(tokenDomain)}`, {
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        });
        if (!res.ok) {
          throw new Error(`Lookup failed: ${res.statusText}`);
        }
        const data = await res.json();
        setRealm(data.realm);
        setStatus(`Realm locked to ${data.realm}.`);
      } catch (err) {
        console.error(err);
        setRealm("");
        setStatus("Could not resolve your realm from domain. Contact an admin.");
      } finally {
        setIsLoading(false);
      }
    };
    doLookup();
  }, [tokenDomain, tokenRealm, keycloak.authenticated, keycloak.token]);

  const fetchUsers = async (targetRealm: string) => {
    setIsUsersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users`, {
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchGroups = async (targetRealm: string) => {
    try {
      const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/groups`, {
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  useEffect(() => {
    const targetRealm = tokenRealm || realm;
    if (targetRealm) {
      fetchUsers(targetRealm);
      fetchGroups(targetRealm);
    }
  }, [tokenRealm, realm]);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    const targetRealm = tokenRealm || realm || "";
    if (!targetRealm) {
      setStatus("Realm not resolved from token or domain. Cannot add users.");
      return;
    }
    if (!name || !email || !role) {
      setStatus("Name, email, and role are required to create a user.");
      return;
    }
    setStatus(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users`, {
        method: "POST",
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          name,
          email,
          role,
          group_id: selectedGroupId || undefined,
        }),
      });
      if (!res.ok) {
        let message = res.statusText;
        try {
          const data = await res.json();
          message = data?.detail || JSON.stringify(data);
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(`HTTP ${res.status}: ${message || "Unknown error"}`);
      }
      const data = await res.json();
      setStatus(
        `User ${username} added to realm ${targetRealm}. Temporary password (one-time): ${data?.temporary_password ?? "N/A"}`
      );
      setUsername("");
      setName("");
      setEmail("");
      setRole("");
      setSelectedGroupId("");
      fetchUsers(targetRealm);
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "Failed to add user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setStatus("Uploading CSV...");
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
      // Expecting CSV columns: username, name, email, role[, group1,group2,...]
      const rows = (data as any[]).map((row) => ({
        username: row.username || "",
        name: row.name || "",
        email: row.email || "",
        role: row.role || "",
        groups: typeof row.groups === "string" ? row.groups.split(",").map((g: string) => g.trim()).filter(Boolean) : [],
        status: "pending",
      }));
      setBulkUsers(rows);
      setStatus(`Imported ${rows.length} users from CSV.`);
    } catch (err) {
      console.error(err);
      setStatus("Error uploading CSV. Ensure columns username,name,email,role are present.");
    }
  };

  const handleBulkCreate = async () => {
    const targetRealm = tokenRealm || realm || "";
    if (!targetRealm) {
      setStatus("Realm not resolved from token or domain. Cannot add users.");
      return;
    }
    // Cache group names to IDs so we can create missing groups only once per run.
    const groupIdCache: Record<string, string> = {};
    groups.forEach((g) => {
      if (g.name && g.id) groupIdCache[g.name.toLowerCase()] = g.id;
    });

    const refreshGroups = async () => {
      try {
        const resp = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/groups`, {
          headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
        });
        if (resp.ok) {
          const data = await resp.json();
          setGroups(data.groups || []);
          return (data.groups as { id?: string; name?: string }[]) || [];
        }
      } catch (e) {
        console.error("Failed to refresh groups", e);
      }
      return groups;
    };

    const ensureGroupExists = async (groupName: string): Promise<string | undefined> => {
      const key = groupName.trim().toLowerCase();
      if (!key) return undefined;
      if (groupIdCache[key]) return groupIdCache[key];
      // Try to create the group; if it already exists server should return conflict or similar.
      try {
        const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/groups`, {
          method: "POST",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: groupName }),
        });
        if (!res.ok) {
          // If already exists, fetch group list to resolve ID.
          if (res.status === 409 || res.status === 400) {
            try {
              const latest = await refreshGroups();
              const found = latest.find((g) => g.name?.toLowerCase() === key);
              if (found?.id) {
                groupIdCache[key] = found.id;
                return found.id;
              }
            } catch (e) {
              console.error("Failed to refetch groups after conflict", e);
            }
          }
          return undefined;
        }
        const data = await res.json();
        const newId = data?.id || data?.group?.id;
        if (newId) {
          groupIdCache[key] = newId;
          // Optimistically add to local groups list.
          setGroups((prev) => [...prev, { id: newId, name: groupName }]);
          return newId;
        }
        // If API doesn't return ID, refetch and resolve by name.
        const latest = await refreshGroups();
        const found = latest.find((g) => g.name?.toLowerCase() === key);
        if (found?.id) {
          groupIdCache[key] = found.id;
          return found.id;
        }
        return undefined;
      } catch (err) {
        console.error("Failed to ensure group", err);
        return undefined;
      }
    };

    const resolveGroupIds = async (groupNames: string[]): Promise<string[]> => {
      const ids: string[] = [];
      for (const name of groupNames) {
        const id = await ensureGroupExists(name);
        if (id) ids.push(id);
      }
      return ids;
    };

    const fetchUserIdByUsername = async (usernameValue: string): Promise<string | undefined> => {
      try {
        const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users`, {
          headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
        });
        if (!res.ok) return undefined;
        const data = await res.json();
        const found = (data?.users || []).find(
          (user: { username?: string }) => user.username === usernameValue
        );
        return found?.id;
      } catch (err) {
        console.error("Failed to resolve user id", err);
        return undefined;
      }
    };

    setIsBulkLoading(true);
    setStatus("Creating users...");
    const updated = [...bulkUsers];
    for (let i = 0; i < updated.length; i++) {
      const u = updated[i];
      if (!u.username || !u.name || !u.email || !u.role) {
        updated[i] = { ...u, status: "missing fields" };
        continue;
      }
      const groupIds = u.groups && u.groups.length ? await resolveGroupIds(u.groups) : [];
      const primaryGroupId = groupIds[0];
      try {
        const res = await fetch(`${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users`, {
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
            group_id: primaryGroupId,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          updated[i] = { ...u, status: `error ${res.status}: ${text || res.statusText}` };
          continue;
        }
        const data = await res.json();

        // Assign user to any remaining groups (including primary, to ensure membership).
        if (groupIds.length > 0) {
          const userId = await fetchUserIdByUsername(u.username);
          if (userId) {
            for (const gid of groupIds) {
              try {
                await fetch(
                  `${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/groups/${encodeURIComponent(
                    gid
                  )}/members/${encodeURIComponent(userId)}`,
                  {
                    method: "POST",
                    headers: { Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "" },
                  }
                );
              } catch (assignErr) {
                console.error("Failed to add user to group", assignErr);
              }
            }
          }
        }

        updated[i] = { ...u, status: `created (temp pwd ${data?.temporary_password ?? "N/A"})` };
        fetchUsers(targetRealm);
      } catch (err) {
        updated[i] = { ...u, status: "error creating user" };
      }
    }
    setBulkUsers(updated);
    setIsBulkLoading(false);
    setStatus("Bulk creation finished.");
    fetchGroups(targetRealm);
  };

  const handleFieldChange = (field: string, value: string) => {
    switch (field) {
      case "username":
        setUsername(value);
        break;
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "role":
        setRole(value);
        break;
      case "selectedGroupId":
        setSelectedGroupId(value);
        break;
      default:
        break;
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!id) return;
    const targetRealm = tokenRealm || realm || "";
    if (!targetRealm) {
      setStatus("Realm not resolved from token or domain. Cannot delete users.");
      return;
    }
    setDeletingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(
        `${API_BASE}/org-manager/${encodeURIComponent(targetRealm)}/users/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      fetchUsers(targetRealm);
    } catch (err) {
      console.error("Failed to delete user", err);
      setStatus("Failed to delete user. Check permissions.");
    } finally {
      setDeletingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  return (
    <div className="liquid-glass-container h-full w-full animate-fade-in">
      {/* Animated background blobs */}
      <div className="liquid-blob liquid-blob-1"></div>
      <div className="liquid-blob liquid-blob-2"></div>
      <div className="liquid-blob liquid-blob-3"></div>

      {/* Header */}
      <div className="liquid-glass-header flex-shrink-0 border-b border-white/20 py-4 px-6 animate-slide-down">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Tenant Manager</h1>
        <p className="text-sm text-gray-600">You are limited to your tenant realm as determined by your Keycloak domain.</p>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-hidden p-6 purple-scrollbar overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="liquid-glass-card p-5">
            <UsersList
              realm={tokenRealm || realm || ""}
              users={users}
              isLoading={isUsersLoading}
              deletingIds={deletingIds}
              onDelete={handleDeleteUser}
            />
          </div>
          <div className="liquid-glass-card p-5 animate-slide-left" style={{ animationDelay: '0.1s' }}>
            <AddUserForm
              realm={tokenRealm || realm || ""}
              groups={groups}
              username={username}
              name={name}
              email={email}
              role={role}
              selectedGroupId={selectedGroupId}
              isLoading={isLoading}
              onChange={handleFieldChange}
              onSubmit={handleAddUser}
            />
          </div>
        </div>

        <div className="mt-6 liquid-glass-card p-5 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <BulkUserImport
            bulkUsers={bulkUsers}
            isBulkLoading={isBulkLoading}
            onCsvUpload={handleCsvUpload}
            onBulkCreate={handleBulkCreate}
          />
        </div>

        {status && (
          <div className="mt-6 liquid-glass-card px-4 py-3 text-sm text-gray-700 animate-scale-in">
            <span className="inline-block w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
            {status}
          </div>
        )}
      </div>
    </div >
  );
}
