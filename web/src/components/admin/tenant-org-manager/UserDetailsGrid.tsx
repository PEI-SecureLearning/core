import { AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TenantUserDetailDto } from "@/types/tenantOrgManager";
import {
    type DetailRow,
    type DetailRowValue,
    formatRoleLabel,
    getRoleBadgeVariantProps,
} from "./userDetailsUtils";

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function renderDetailValue(value: DetailRowValue) {
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (value === null || value === undefined || value === "") {
        return <span className="text-muted-foreground">Not set</span>;
    }

    return value;
}

function RoleBadge({ role }: { role?: string | null }) {
    if (!role) {
        return <span className="text-muted-foreground">Not set</span>;
    }

    const { variant, className } = getRoleBadgeVariantProps(role);
    return (
        <Badge variant={variant} className={className}>
            {formatRoleLabel(role)}
        </Badge>
    );
}

function EmailVerificationIcon({ verified }: { verified?: boolean }) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        className="inline-flex items-center"
                        aria-label={verified ? "Verified email" : "Unverified email"}
                    >
                        {verified ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                    {verified ? "this email has been verified." : "this email has not been verified."}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function DetailRowCard({ row, user }: { row: DetailRow; user: TenantUserDetailDto | null }) {
    const isEmail = row.label === "Email";
    const isRole = row.label === "Role";

    return (
        <div className="rounded-lg border border-border/60 bg-background p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isEmail ? <Mail className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />}
                <span>{row.label}</span>
            </div>

            {isEmail && (
                <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="wrap-break-word text-sm font-medium text-foreground">
                        {renderDetailValue(row.value)}
                    </div>
                    <EmailVerificationIcon verified={user?.email_verified} />
                </div>
            )}

            {isRole && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={user?.role ?? (user?.is_org_manager ? "org_manager" : null)} />
                </div>
            )}

            {!isEmail && !isRole && (
                <div className="mt-2 wrap-break-word text-sm font-medium text-foreground">
                    {renderDetailValue(row.value)}
                </div>
            )}
        </div>
    );
}

// ─── Groups panel ─────────────────────────────────────────────────────────────

function GroupsPanel({ user }: { user: TenantUserDetailDto | null }) {
    return (
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
                                <Badge
                                    key={group.id ?? group.name ?? String(index)}
                                    variant="outline"
                                    className="px-3 py-1 text-sm normal-case"
                                >
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
    );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface UserDetailsGridProps {
    user: TenantUserDetailDto | null;
    detailRows: DetailRow[];
}

export function UserDetailsGrid({ user, detailRows }: UserDetailsGridProps) {
    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2 lg:row-span-2">
                {detailRows.map((row) => (
                    <DetailRowCard key={row.label} row={row} user={user} />
                ))}
            </div>

            <GroupsPanel user={user} />
        </section>
    );
}
