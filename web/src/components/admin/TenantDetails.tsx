import { useEffect, useState, useCallback, type FormEvent } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import {
  Building2,
  ArrowLeft,
  UserPlus,
  Mail,
  Shield,
  Loader2,
  BookOpen,
  Check,
  Trash2,
  ShieldCheck,
  HardDrive
} from "lucide-react";
import { motion } from "motion/react";

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
  const logoVersion = info?.logoUpdatedAt ? encodeURIComponent(info.logoUpdatedAt) : "";
  const logoQuery = logoVersion ? `?v=${logoVersion}` : "";
  const logoUrl = `${API_BASE}/realms/${encodeURIComponent(realmName)}/logo${logoQuery}`;
  const hasLogoError = logoError;

  const getFeatureIcon = (feature: string) => {
    if (feature === 'phishing') return <Shield size={16} className="text-orange-500" />
    if (feature === 'lms') return <BookOpen size={16} className="text-blue-500" />
    return <Check size={16} className="text-primary/90" />
  };

  const formatFeatureName = (feature: string): string => {
    if (feature === 'phishing') return 'Phishing Engine'
    if (feature === 'lms') return 'LMS Engine'
    return feature
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  };

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
        .map((u: { id?: string; username?: string; email?: string }) => ({
          id: u.id,
          name: u.username || "Org Manager",
          email: u.email
        }));
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

  const handleAddManager = async (e: FormEvent) => {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border/60">
        <Link to="/admin/tenants" className="p-2 bg-background border border-border hover:bg-surface-subtle rounded-md transition-all shadow-sm group">
          <ArrowLeft size={18} className="text-muted-foreground transition-transform group-hover:-translate-x-1" />
        </Link>
        <div className="w-14 h-14 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground overflow-hidden shadow-sm">
          {hasLogoError ? (
            <Building2 size={24} />
          ) : (
            <img
              src={logoUrl}
              alt={`${info?.displayName || realmName} logo`}
              className="w-full h-full object-contain p-2"
              onError={() => setLogoError(true)}
              loading="lazy"
            />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{info?.displayName || realmName}</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${info?.enabled === false
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${info?.enabled === false ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
              {info?.enabled === false ? "Inactive" : "Active"}
            </span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-primary" />
              <span>{info?.domain || realmName}</span>
            </div>
            <span className="text-muted-foreground/50">|</span>
            <div className="flex items-center gap-1.5">
              <Mail size={12} className="text-primary" />
              <span>{info?.realm}</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-md border border-border/40 shadow-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Synchronizing realm data...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-background rounded-md border border-border/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Organization Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface-subtle/50 p-4 rounded-md border border-border/40">
                <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">Service Plan</div>
                <div className="font-bold text-foreground flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Premium Enterprise
                </div>
              </div>
              <div className="bg-surface-subtle/50 p-4 rounded-md border border-border/40">
                <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-1">Creation Date</div>
                <div className="font-bold text-foreground text-sm">{(info?.attributes as any)?.created || "March 08, 2026"}</div>
              </div>
              <div className="bg-surface-subtle/50 p-4 rounded-md border border-border/40">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Global Seats</div>
                  <div className="text-xs font-bold text-foreground">{usageCurrent} / {usageLimit}</div>
                </div>
                <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usageLimit ? (usageCurrent / usageLimit) * 100 : 0}%` }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-md border border-border/60 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/10 rounded-md">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Organization Managers</h3>
              </div>
            </div>

            <form onSubmit={handleAddManager} className="flex gap-3">
              <div className="flex-1 relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 group-focus-within:text-primary/90 transition-colors" size={16} />
                <input
                  type="email"
                  placeholder="Manager email address"
                  className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-medium text-sm"
                  value={orgManagerEmail}
                  onChange={(e) => setOrgManagerEmail(e.target.value)}
                  list="realm-user-emails"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary transition-all font-bold text-sm flex items-center gap-2 shadow-sm active:scale-95"
              >
                <UserPlus size={16} />
                Assign Role
              </button>
            </form>

            {managers.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {managers.map((manager) => (
                  <motion.div
                    key={manager.email || manager.name}
                    whileHover={{ scale: 1.005 }}
                    className="flex items-center justify-between p-3 bg-background rounded-md border border-border/40 shadow-sm hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-base border border-purple-100">
                        {manager.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{manager.name}</div>
                        <div className="text-[10px] text-muted-foreground font-medium">{manager.email || "—"}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteManager(manager.id)}
                      className="p-1.5 text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                      title="Revoke manager role"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground/70 font-medium italic py-6 border border-dashed border-border/40 rounded-md text-center">
                No organization managers have been assigned.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-background rounded-md border border-border/60 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <HardDrive className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Access Control</h3>
            </div>
            <div className="space-y-2">
              {info?.features && Object.keys(info.features).length > 0 ? (
                Object.entries(info.features).map(([feature, active]) => (
                  <div key={feature} className={`
                    flex items-center justify-between p-3 rounded-md border transition-all
                    ${active ? 'bg-background border-border/40 shadow-sm' : 'bg-surface-subtle border-transparent opacity-50'}
                  `}>
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-md ${active ? 'bg-primary/10 text-primary' : 'bg-muted/60 text-muted-foreground/70'}`}>
                        {getFeatureIcon(feature)}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                        {formatFeatureName(feature)}
                      </span>
                    </div>
                    {active ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border border-white">
                        <Check size={12} className="text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-muted/60 rounded-full border border-white" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground/70 font-medium italic text-center py-2">No active engines found</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TenantDetails;
