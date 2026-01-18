import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { Building2, ArrowLeft, UserPlus, Mail, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";

type RealmInfo = {
  realm: string;
  displayName: string;
  enabled: boolean;
  domain?: string;
  features?: Record<string, boolean>;
  attributes?: Record<string, unknown>;
  logoUpdatedAt?: string | null;
  user_count?: number;
  users?: Array<{
    id?: string;
    username?: string;
    email?: string;
    is_org_manager?: boolean;
    email_verified?: boolean;
    firstName?: string;
    lastName?: string;
    /** some payloads use an empty string as key for id */
    "": string;
  }>;
};

export function TenantDetails() {
  const { tenantId: realmName } = useParams({ from: "/admin/tenants/$tenantId" });
  const { keycloak } = useKeycloak();
  const [orgManagerEmail, setOrgManagerEmail] = useState("");
  const [info, setInfo] = useState<RealmInfo | null>(null);
  const [managers, setManagers] = useState<{ id?: string; name: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  const fetchInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/realms/${encodeURIComponent(realmName)}/info`, {
        headers: {
          Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch realm info (${res.status})`);
      const raw = await res.json();
      const payload = raw?.realm ? raw.realm : raw;

      const mappedUsers =
        (payload?.users || []).map((u: any) => ({
          id: u.id || u[""] || u._id,
          username: u.username,
          email: u.email,
          is_org_manager: u.is_org_manager,
          email_verified: u.email_verified ?? u.emailVerified,
          firstName: u.firstName,
          lastName: u.lastName,
        })) || [];

      const infoData: RealmInfo = {
        realm: payload?.realm || realmName,
        displayName: payload?.displayName || payload?.realm || realmName,
        enabled: payload?.enabled ?? true,
        domain: payload?.domain,
        features: payload?.features || {},
        attributes: payload?.attributes || {},
        logoUpdatedAt: payload?.logoUpdatedAt,
        user_count: payload?.user_count ?? mappedUsers.length,
        users: mappedUsers,
      };

      setInfo(infoData);
      setLogoError(false);

      const orgManagers = mappedUsers
        .filter((u: { is_org_manager?: boolean }) => u.is_org_manager)
        .map((u: { id?: string; username?: string; email?: string }) => ({ id: u.id, name: u.username || "Org Manager", email: u.email }));
      setManagers(orgManagers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tenant details");
    } finally {
      setLoading(false);
    }
  }, [API_BASE, keycloak.token, realmName]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const targetEmail = orgManagerEmail.trim().toLowerCase();
    if (!targetEmail) {
      setError("Please enter an email.");
      return;
    }

    const user = (info?.users || []).find((u) => (u.email || "").toLowerCase() === targetEmail);
    if (!user?.id) {
      setError("User not found in this realm.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/realms/${encodeURIComponent(realmName)}/role/${encodeURIComponent(user.id)}?role=ORG_MANAGER`,
        {
          method: "PUT",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to assign manager role (${res.status})`);
      await fetchInfo(); // reload state
      setOrgManagerEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign manager role");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManager = async (userId?: string) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/realms/admin/${encodeURIComponent(realmName)}/users/${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: keycloak.token ? `Bearer ${keycloak.token}` : "",
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to delete user (${res.status})`);

      await fetchInfo(); // refresh to reflect change
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const usageCurrent = info?.users ? info.users.filter((u) => !!u.id).length : info?.user_count || 0;
  const usageLimit = 500;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/tenants" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 overflow-hidden">
          {!logoError ? (
            <img
              src={`${API_BASE}/realms/${encodeURIComponent(realmName)}/logo${info?.logoUpdatedAt ? `?v=${encodeURIComponent(info.logoUpdatedAt)}` : ''}`}
              alt={`${info?.displayName || realmName} logo`}
              className="w-full h-full object-contain"
              onError={() => setLogoError(true)}
              loading="lazy"
            />
          ) : (
            <Building2 size={24} />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{info?.displayName || realmName}</h2>
          <div className="flex items-center gap-2 text-gray-500">
            <Building2 size={16} />
            <span>{info?.domain || "—"}</span>
            <span className="mx-2">•</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${info?.enabled === false ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
            >
              {(info?.enabled === false ? "inactive" : "active").toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading realm details...
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Overview</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Plan Type</div>
                <div className="font-medium text-gray-900">Standard</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Created On</div>
                <div className="font-medium text-gray-900">{(info?.attributes as any)?.created || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">User Usage</div>
                <div className="font-medium text-gray-900">
                  {usageCurrent} / {usageLimit}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${usageLimit ? (usageCurrent / usageLimit) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Organization Manager</h3>
            <form onSubmit={handleAddManager} className="flex gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="Enter manager email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={orgManagerEmail}
                  onChange={(e) => setOrgManagerEmail(e.target.value)}
                  list="realm-user-emails"
                />
                <datalist id="realm-user-emails">
                  {(info?.users || [])
                    .filter((u) => u.email)
                    .map((u) => (
                      <option key={u.id || u.email} value={u.email} />
                    ))}
                </datalist>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <UserPlus size={18} />
                Assign Manager
              </button>
            </form>

            {managers.length > 0 ? (
              <div className="space-y-2">
                {managers.map((manager) => (
                  <div
                    key={manager.email || manager.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {manager.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{manager.name}</div>
                        <div className="text-sm text-gray-500">{manager.email || "—"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteManager(manager.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No org managers found.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Features</h3>
            <div className="space-y-3">
              {info?.features && Object.keys(info.features).length > 0 ? (
                Object.entries(info.features).map(([feature, active]) => (
                  <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize text-gray-700">{feature}</span>
                    {active ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-gray-400" />}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No feature data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Status</h3>
            <div className="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <Shield size={20} />
              <span className="font-medium">System Secure</span>
            </div>
            <div className="mt-4 text-sm text-gray-500">Last security scan: 2 hours ago</div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TenantDetails;
