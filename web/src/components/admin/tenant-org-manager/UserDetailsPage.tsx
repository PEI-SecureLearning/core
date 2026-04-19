import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useKeycloak } from "@react-keycloak/web";
import { AlertTriangle, ArrowLeft, Award, CalendarClock, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { SectionSeparator } from "@/components/shared/SectionSeparator";
import { userApi } from "@/services/userApi";
import type { CampaignUserSending } from "@/services/campaignsApi";
import type { TenantUserDetailDto, UserCertificateDto } from "@/types/tenantOrgManager";

const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "sent":
            return "secondary";
        case "opened":
            return "outline";
        case "clicked":
        case "phished":
            return "destructive";
        default:
            return "outline";
    }
};

const formatRoleLabel = (role?: string | null) => {
    if (!role) {
        return "Not set";
    }

    const normalizedRole = role.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

    if (normalizedRole === "org_manager") {
        return "Org Manager";
    }

    if (normalizedRole === "user") {
        return "User";
    }

    return role
        .split(/[_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
};

const getRoleBadge = (role?: string | null) => {
    if (!role) {
        return <span className="text-muted-foreground">Not set</span>;
    }

    const normalizedRole = role.toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");

    if (normalizedRole === "org_manager") {
        return (
            <Badge className="border-violet-500/20 bg-violet-500 text-white hover:bg-violet-500/90">
                {formatRoleLabel(role)}
            </Badge>
        );
    }

    if (normalizedRole === "user") {
        return <Badge variant="outline">{formatRoleLabel(role)}</Badge>;
    }

    return <Badge variant="secondary">{formatRoleLabel(role)}</Badge>;
};

const getMostRecentStatusDate = (sending: CampaignUserSending) => {
    const candidates = [sending.phished_at, sending.clicked_at, sending.opened_at, sending.sent_at]
        .filter((value): value is string => Boolean(value))
        .map((value) => ({
            value,
            time: new Date(value).getTime(),
        }))
        .filter((entry) => !Number.isNaN(entry.time));

    if (candidates.length === 0) {
        return "-";
    }

    const mostRecent = candidates.reduce((latest, current) => (current.time > latest.time ? current : latest), candidates[0]);
    return new Date(mostRecent.value).toLocaleDateString();
};

const formatCertificateDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "-";
    }

    return parsedDate.toLocaleDateString();
};

const getCertificateBadgeVariant = (expired: boolean) => (expired ? "destructive" : "secondary");

type DetailRowValue = string | number | boolean | null | undefined;

interface DetailRow {
    label: string;
    value: DetailRowValue;
}

export function UserDetailsPage() {
    const params = useParams({ from: "/users/$id" });
    const userId = params.id;
    const { keycloak } = useKeycloak();

    const [user, setUser] = useState<TenantUserDetailDto | null>(null);
    const [sendings, setSendings] = useState<CampaignUserSending[]>([]);
    const [certificates, setCertificates] = useState<UserCertificateDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSendings, setLoadingSendings] = useState(true);
    const [loadingCertificates, setLoadingCertificates] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingsError, setSendingsError] = useState<string | null>(null);
    const [certificatesError, setCertificatesError] = useState<string | null>(null);

    const realm = useMemo(() => {
        const iss = (keycloak.tokenParsed as { iss?: string } | undefined)?.iss;
        if (!iss) return "";
        const parts = iss.split("/realms/");
        return parts[1] ?? "";
    }, [keycloak.tokenParsed]);

    useEffect(() => {
        const loadUser = async () => {
            if (!realm || !userId) {
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const details = await userApi.getUser(realm, userId);
                setUser(details);
            } catch (err) {
                console.error("Failed to load user details", err);
                setError("Failed to load user details.");
            } finally {
                setLoading(false);
            }
        };

        void loadUser();
    }, [realm, userId, keycloak.token]);

    useEffect(() => {
        const loadSendings = async () => {
            if (!realm || !userId) {
                return;
            }

            setLoadingSendings(true);
            setSendingsError(null);

            try {
                const details = await userApi.getUserSendings(realm, userId);
                setSendings(details);
            } catch (err) {
                console.error("Failed to load user sendings", err);
                setSendingsError("Failed to load email sendings.");
            } finally {
                setLoadingSendings(false);
            }
        };

        void loadSendings();
    }, [realm, userId, keycloak.token]);

    useEffect(() => {
        const loadCertificates = async () => {
            if (!userId) {
                return;
            }

            setLoadingCertificates(true);
            setCertificatesError(null);

            try {
                const details = await userApi.getUserCertificates(userId, true);
                console.log(details)
                setCertificates(details);
            } catch (err) {
                console.error("Failed to load user certificates", err);
                setCertificatesError("Failed to load certificates.");
            } finally {
                setLoadingCertificates(false);
            }
        };

        void loadCertificates();
    }, [userId, keycloak.token]);

    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
        || user?.username
        || userId;

    const certificateCountLabel = certificates.length === 1 ? "" : "s";
    const certificatesSummary = loadingCertificates
        ? "Loading..."
        : `${certificates.length} earned certificate${certificateCountLabel}`;

    const detailRows: DetailRow[] = [
        { label: "Username", value: user?.username },
        { label: "Email", value: user?.email },
        { label: "Role", value: user?.role },
        { label: "Realm", value: user?.realm || realm },
    ];

    const renderDetailValue = (value: string | number | boolean | null | undefined) => {
        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }

        if (value === null || value === undefined || value === "") {
            return <span className="text-muted-foreground">Not set</span>;
        }

        return value;
    };

    const renderDetailContent = (row: DetailRow) => {
        if (row.label === "Email") {
            return (
                <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="wrap-break-word text-sm font-medium text-foreground">
                        {renderDetailValue(row.value)}
                    </div>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex items-center" aria-label={user?.email_verified ? "Verified email" : "Unverified email"}>
                                    {user?.email_verified ? (
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-destructive" />
                                    )}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6}>
                                {user?.email_verified
                                    ? "this email has been verified."
                                    : "this email has not been verified."}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            );
        }

        if (row.label === "Role") {
            return (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getRoleBadge(user?.role ?? (user?.is_org_manager ? "org_manager" : null))}
                </div>
            );
        }

        return (
            <div className="mt-2 wrap-break-word text-sm font-medium text-foreground">
                {renderDetailValue(row.value)}
            </div>
        );
    };

    let sendingsTableBody: ReactNode;

    if (loadingSendings) {
        sendingsTableBody = (
            <tr>
                <td colSpan={3} className="p-4 text-muted-foreground">
                    Loading email sendings...
                </td>
            </tr>
        );
    } else if (sendingsError) {
        sendingsTableBody = (
            <tr>
                <td colSpan={3} className="p-4 text-error">
                    {sendingsError}
                </td>
            </tr>
        );
    } else if (sendings.length === 0) {
        sendingsTableBody = (
            <tr>
                <td colSpan={3} className="p-4 text-muted-foreground">
                    No email sendings found for this user.
                </td>
            </tr>
        );
    } else {
        sendingsTableBody = (
            <>
                {sendings.map((sending, index) => (
                    <tr key={`${sending.user_id}-${sending.email}-${index}`}>
                        <td className="p-3 text-foreground capitalize">
                            <Badge variant={getStatusBadgeVariant(sending.status)} className="capitalize text-sm px-3 py-1">
                                {sending.status}
                            </Badge>
                        </td>
                        <td className="p-3 text-foreground">{getMostRecentStatusDate(sending)}</td>
                        <td className="p-3 text-foreground">
                            {sending.campaign_id ? (
                                <Link
                                    to="/campaigns/$id"
                                    params={{ id: sending.campaign_id.toString() }}
                                    className="text-primary hover:underline"
                                >
                                    {sending.campaign_name || "View campaign"}
                                </Link>
                            ) : (
                                <span className="text-muted-foreground">
                                    {sending.campaign_name || "No campaign"}
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </>
        );
    }

    let certificatesContent: ReactNode;

    if (loadingCertificates) {
        certificatesContent = (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading certificates...
            </div>
        );
    } else if (certificatesError) {
        certificatesContent = (
            <div className="p-4 text-sm text-error">
                {certificatesError}
            </div>
        );
    } else if (certificates.length === 0) {
        certificatesContent = (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                <Award className="h-10 w-10 text-primary/40" />
                <p className="text-sm font-medium text-foreground">No certificates found</p>
                <p className="text-xs">This user has not earned any certificates yet.</p>
            </div>
        );
    } else {
        certificatesContent = (
            <div className="grid gap-3 p-4 sm:p-6">
                {certificates.map((certificate) => (
                    <div
                        key={`${certificate.user_id}-${certificate.course_id}`}
                        className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-surface-subtle p-4 shadow-sm transition-all hover:border-primary/30 hover:bg-background"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                        {certificate.course_name || "Untitled course"}
                                    </h3>
                                    <Badge variant={getCertificateBadgeVariant(certificate.expired)} className="capitalize">
                                        {certificate.expired ? "Expired" : "Active"}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {certificate.category || "Uncategorized"}
                                    {certificate.difficulty ? ` · ${certificate.difficulty}` : ""}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Issued {formatCertificateDate(certificate.last_emission_date)}
                            </span>
                            <span>
                                Expires {certificate.expiration_date ? formatCertificateDate(certificate.expiration_date) : "-"}
                            </span>
                            <span className="text-primary/80">
                                Course ID {certificate.course_id}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col bg-surface-subtle animate-fade-in">
            <div className="bg-background border-b border-border px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <Link to="/users" className="p-2 rounded-md hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold text-foreground truncate">{displayName}</h1>
                        <p className="text-sm text-muted-foreground truncate">User details</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-3 rounded-md border border-border/40 shadow-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Loading user details...
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                            {error}
                        </div>
                    )}

                    <section className="bg-background border border-border/60 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 flex items-start justify-between gap-4">
                            <div>

                                <h2 className="text-2xl font-semibold text-foreground wrap-break-word">{displayName}</h2>
                                <p className="text-sm text-muted-foreground break-all mt-1">{user?.email || "No email available"}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${user?.active === false ? "border-warning/20 bg-warning/10 text-warning" : "border-success/20 bg-success/10 text-success"}`}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {user?.active === false ? "Inactive" : "Active"}
                                </span>
                            </div>
                        </div>
                    </section>

                    <SectionSeparator title="Details" />

                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2 lg:row-span-2">
                            {detailRows.map((row) => (
                                <div key={row.label} className="rounded-lg border border-border/60 bg-background p-4 shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {row.label === "Email" ? <Mail className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />}
                                        <span>{row.label}</span>
                                    </div>
                                    {renderDetailContent(row)}
                                </div>
                            ))}
                        </div>

                        <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm lg:col-start-3 lg:row-span-2 lg:h-full">
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                                <span>Groups ({user?.groups?.length ?? 0})</span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {user?.groups?.length ? (
                                    user.groups.map((group, index) => {
                                        const groupLabel = group.name || "Unnamed group";

                                        if (!group.id) {
                                            return (
                                                <Badge key={group.id ?? group.name ?? String(index)} variant="outline" className="px-3 py-1 text-sm normal-case">
                                                    {groupLabel}
                                                </Badge>
                                            );
                                        }

                                        return (
                                            <Badge
                                                key={group.id}

                                                variant="secondary"
                                                className="px-3 py-1 text-sm normal-case text-primary hover:underline"
                                            >
                                                <Link to="/usergroups/$id" params={{ id: group.id }}>
                                                    {groupLabel}
                                                </Link>
                                            </Badge>
                                        );
                                    })
                                ) : (
                                    <span className="text-sm text-muted-foreground">No groups assigned</span>
                                )}
                            </div>
                        </div>
                    </section>

                    <SectionSeparator title="Email sendings" />

                    <section className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-surface-subtle text-muted-foreground">
                                    <tr>
                                        <th className="text-left font-medium p-3">
                                            Status
                                        </th>
                                        <th className="text-left font-medium p-3">Date</th>
                                        <th className="text-left font-medium p-3">Campaign</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {sendingsTableBody}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <SectionSeparator title="Certificates" />
                    <section className="rounded-xl border border-border/60 bg-background shadow-sm overflow-hidden">
                        <div className="px-6 py-5 flex items-center justify-between gap-4 border-b border-border/60">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">Certificates</h2>
                                <p className="text-sm text-muted-foreground">
                                    {certificatesSummary}
                                </p>
                            </div>
                        </div>
                        {certificatesContent}
                    </section>

                </div>
            </div>
        </div>
    );
}