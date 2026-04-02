import { Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { AlertTriangle, ChevronLeft, Clock3, Lock, Pencil } from "lucide-react";

import { SummaryCollapsibleCard } from "@/components/campaigns/SummaryCollapsibleCard";
import {
    fetchOrgManagerCampaignDetail,
    type CampaignDetail
} from "@/services/campaignsApi";
import { fetchPhishingKits } from "@/services/phishingKitsApi";
import { fetchSendingProfiles } from "@/services/sendingProfilesApi";
import { userGroupsApi } from "@/services/userGroupsApi";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";
import type { UserGroupMemberDto } from "@/types/userGroups";
import { Separator } from "@/components/ui/separator";

interface CampaignGroupWithMembers {
    id: string;
    name: string;
    members: UserGroupMemberDto[];
}

function getRealmFromToken(tokenParsed: unknown): string | null {
    const iss = (tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return "-";
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "-";
    }

    return parsed.toLocaleString();
}

export default function CampaignDetails() {
    const { id: campaignId } = useParams({ from: "/campaigns/$id" });
    const { keycloak } = useKeycloak();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [groupDetails, setGroupDetails] = useState<CampaignGroupWithMembers[]>([]);
    const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [phishingKitDetails, setPhishingKitDetails] = useState<PhishingKitDisplayInfo[]>([]);
    const [phishingKitLoadError, setPhishingKitLoadError] = useState<string | null>(null);
    const [loadingPhishingKits, setLoadingPhishingKits] = useState(false);
    const [sendingProfileDetails, setSendingProfileDetails] = useState<SendingProfileDisplayInfo[]>([]);
    const [sendingProfileLoadError, setSendingProfileLoadError] = useState<string | null>(null);
    const [loadingSendingProfiles, setLoadingSendingProfiles] = useState(false);

    const realm = useMemo(
        () => getRealmFromToken(keycloak.tokenParsed),
        [keycloak.tokenParsed]
    );

    const isEditable = campaign?.status === "scheduled";

    const fetchCampaign = useCallback(async () => {
        if (!realm || !campaignId) {
            setLoadError("Missing campaign context.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(null);

        try {
            const detail = await fetchOrgManagerCampaignDetail(
                realm,
                campaignId,
                keycloak.token
            );
            setCampaign(detail);
        } catch (error) {
            setLoadError(
                error instanceof Error ? error.message : "Failed to load campaign."
            );
        } finally {
            setLoading(false);
        }
    }, [campaignId, keycloak.token, realm]);

    useEffect(() => {
        void fetchCampaign();
    }, [fetchCampaign]);

    useEffect(() => {
        const loadGroupsAndMembers = async () => {
            if (!realm || !campaign) {
                setGroupDetails([]);
                setGroupLoadError(null);
                setLoadingGroups(false);
                return;
            }

            if (campaign.user_group_ids.length === 0) {
                setGroupDetails([]);
                setGroupLoadError(null);
                setLoadingGroups(false);
                return;
            }

            setLoadingGroups(true);
            setGroupLoadError(null);

            try {
                const groupsRes = await userGroupsApi.getGroups(realm);
                const groupsById = new Map(
                    groupsRes.groups
                        .filter((group) => typeof group.id === "string" && group.id.length > 0)
                        .map((group) => [group.id as string, group])
                );

                const membersPerGroup = await Promise.all(
                    campaign.user_group_ids.map(async (groupId) => {
                        try {
                            const membersRes = await userGroupsApi.getGroupMembers(realm, groupId);
                            return {
                                id: groupId,
                                name: groupsById.get(groupId)?.name || groupId,
                                members: membersRes.members || []
                            };
                        } catch {
                            return {
                                id: groupId,
                                name: groupsById.get(groupId)?.name || groupId,
                                members: []
                            };
                        }
                    })
                );

                setGroupDetails(membersPerGroup);
            } catch (error) {
                setGroupLoadError(
                    error instanceof Error ? error.message : "Failed to load campaign groups."
                );
                setGroupDetails([]);
            } finally {
                setLoadingGroups(false);
            }
        };

        void loadGroupsAndMembers();
    }, [campaign, realm]);

    useEffect(() => {
        const loadPhishingKits = async () => {
            if (!campaign || campaign.phishing_kit_ids.length === 0) {
                setPhishingKitDetails([]);
                setPhishingKitLoadError(null);
                setLoadingPhishingKits(false);
                return;
            }

            setLoadingPhishingKits(true);
            setPhishingKitLoadError(null);

            try {
                const kits = await fetchPhishingKits();
                const selectedKitIds = new Set(campaign.phishing_kit_ids);
                setPhishingKitDetails(kits.filter((kit) => selectedKitIds.has(kit.id)));
            } catch (error) {
                setPhishingKitLoadError(
                    error instanceof Error ? error.message : "Failed to load phishing kits."
                );
                setPhishingKitDetails([]);
            } finally {
                setLoadingPhishingKits(false);
            }
        };

        void loadPhishingKits();
    }, [campaign]);

    useEffect(() => {
        const loadSendingProfiles = async () => {
            if (!campaign || !realm || campaign.sending_profile_ids.length === 0) {
                setSendingProfileDetails([]);
                setSendingProfileLoadError(null);
                setLoadingSendingProfiles(false);
                return;
            }

            setLoadingSendingProfiles(true);
            setSendingProfileLoadError(null);

            try {
                const profiles = await fetchSendingProfiles(realm, keycloak.token);
                const selectedProfileIds = new Set(campaign.sending_profile_ids);
                setSendingProfileDetails(
                    profiles.filter((profile) => selectedProfileIds.has(profile.id))
                );
            } catch (error) {
                setSendingProfileLoadError(
                    error instanceof Error ? error.message : "Failed to load sending profiles."
                );
                setSendingProfileDetails([]);
            } finally {
                setLoadingSendingProfiles(false);
            }
        };

        void loadSendingProfiles();
    }, [campaign, keycloak.token, realm]);

    const totalRecipients = campaign?.total_recipients ?? 0;
    const totalSendings = campaign?.user_sendings.length ?? 0;
    const successfullySent = campaign?.user_sendings.filter((sending) => Boolean(sending.sent_at)).length ?? 0;
    const totalTargetedUsers = groupDetails.reduce((acc, group) => acc + group.members.length, 0)

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background text-muted-foreground">
                <div className="flex items-center gap-3 text-sm">
                    <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Loading campaign...</span>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="h-full w-full bg-background p-8 space-y-6">
                <Link
                    to="/campaigns"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft size={16} />
                    Back to campaigns
                </Link>

                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                    {loadError || "Campaign data is unavailable."}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-background p-6 md:p-8 space-y-6 overflow-auto">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Link
                        to="/campaigns"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                        aria-label="Back to campaigns"
                    >
                        <ChevronLeft size={18} />
                    </Link>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                                {campaign.name}
                            </h1>

                            <div
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isEditable
                                    ? "border-success/30 bg-success/10 text-success"
                                    : "border-warning/30 bg-warning/10 text-warning"
                                    }`}
                            >
                                {isEditable ? <Clock3 size={12} /> : <Lock size={12} />}
                                <span className="uppercase tracking-wide">{campaign.status}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditable ? (
                    <Link
                        to="/campaigns/$id/edit"
                        params={{ id: campaignId }}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Pencil size={14} />
                        Edit campaign
                    </Link>
                ) : (
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground opacity-60 cursor-not-allowed"
                        disabled
                    >
                        <Pencil size={14} />
                        Edit campaign
                    </button>
                )}
            </div>

            {loadError && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{loadError}</span>
                </div>
            )}


            <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Details
                </span>
                <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-12 gap-4 text-sm">

                <div className="col-span-4 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Start</p>
                    <p className="text-foreground mt-1 text-wrap">
                        {new Date(campaign.begin_date).toLocaleString()}
                    </p>
                </div>

                <div className="col-span-4 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">End</p>
                    <p className="text-foreground mt-1 text-wrap">
                        {new Date(campaign.end_date).toLocaleString()}
                    </p>
                </div>

                <div className="col-span-4 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Send interval</p>
                    <p className="text-foreground mt-1">
                        Every {Math.max(1, Math.floor(campaign.sending_interval_seconds / 60))} minute(s)
                    </p>
                </div>

                <SummaryCollapsibleCard
                    className="col-span-12"
                    title={`Target groups: ${groupDetails.length}`}
                    subtitle={`Targeted users: ${totalTargetedUsers}`}
                >
                    <div className="space-y-4">
                        {loadingGroups && (
                            <div className="text-sm text-muted-foreground">Loading group memberships...</div>
                        )}

                        {groupLoadError && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                                {groupLoadError}
                            </div>
                        )}

                        {!loadingGroups && !groupLoadError && groupDetails.length === 0 && (
                            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                                No user groups linked to this campaign.
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {groupDetails.map((group) => (
                                <div key={group.id} className="rounded-xl border border-border bg-surface p-4 flex justify-between items-center align-middle gap-2">
                                    <Link
                                        to={"/usergroups/$id"}
                                        params={{ id: group.id }}
                                        className="font-medium text-primary underline"
                                    >
                                        {group.name}
                                    </Link>
                                    <span className="text-xs text-muted-foreground">
                                        {group.members.length} member{group.members.length > 1 ? "s" : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </SummaryCollapsibleCard>

                <SummaryCollapsibleCard
                    className="col-span-12 lg:col-span-6"
                    title={`Phishing kits: ${phishingKitDetails.length}`}

                >
                    <div className="space-y-4">
                        {loadingPhishingKits && (
                            <div className="text-sm text-muted-foreground">Loading phishing kits...</div>
                        )}

                        {phishingKitLoadError && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                                {phishingKitLoadError}
                            </div>
                        )}

                        {!loadingPhishingKits && !phishingKitLoadError && phishingKitDetails.length === 0 && (
                            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                                No phishing kits linked to this campaign.
                            </div>
                        )}

                        <div className="space-y-3">
                            {phishingKitDetails.map((kit) => (
                                <div key={kit.id} className="rounded-xl border border-border bg-surface p-4 flex items-start align-middle gap-3">

                                    <div>
                                        <p className="font-medium text-foreground">{kit.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {kit.description?.trim() || "No description"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SummaryCollapsibleCard>

                <SummaryCollapsibleCard
                    className="col-span-12 lg:col-span-6"
                    title={`Sending profiles: ${sendingProfileDetails.length}`}
                >
                    <div className="space-y-4">
                        {loadingSendingProfiles && (
                            <div className="text-sm text-muted-foreground">Loading sending profiles...</div>
                        )}

                        {sendingProfileLoadError && (
                            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                                {sendingProfileLoadError}
                            </div>
                        )}

                        {!loadingSendingProfiles && !sendingProfileLoadError && sendingProfileDetails.length === 0 && (
                            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                                No sending profiles linked to this campaign.
                            </div>
                        )}

                        <div className="space-y-3">
                            {sendingProfileDetails.map((profile) => (
                                <div key={profile.id} className="rounded-xl border border-border bg-surface p-4 flex items-center align-middle gap-3">
                                    <div>
                                        <Link
                                            to={"/sending-profiles/$id"}
                                            params={{ id: profile.id.toString() }}
                                            className="font-medium text-primary underline"
                                        >
                                            {profile.name}
                                        </Link>

                                        <p className="text-sm text-foreground mt-1">
                                            <span className="font-medium">Address:</span> {profile.from_email}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <span className="font-medium text-foreground">SMTP config: </span>
                                            {profile.smtp_host}:{profile.smtp_port}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </SummaryCollapsibleCard>

            </div>

            <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Stats
                </span>
                <Separator className="flex-1" />
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Email Sendings
                </span>
                <Separator className="flex-1" />
            </div>



            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Email sendings</h2>
                <p className="text-sm text-muted-foreground">
                    {totalSendings} total records, {successfullySent} sent, {Math.max(totalRecipients - successfullySent, 0)} pending/unsent.
                </p>

                <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-surface-subtle text-muted-foreground">
                            <tr>
                                <th className="text-left font-medium p-3">User</th>
                                <th className="text-left font-medium p-3">Email</th>
                                <th className="text-left font-medium p-3">Status</th>
                                <th className="text-left font-medium p-3">Sent</th>
                                <th className="text-left font-medium p-3">Opened</th>
                                <th className="text-left font-medium p-3">Clicked</th>
                                <th className="text-left font-medium p-3">Phished</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {campaign.user_sendings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-muted-foreground">
                                        No sending records available for this campaign.
                                    </td>
                                </tr>
                            ) : (
                                campaign.user_sendings.map((sending) => (
                                    <tr key={`${sending.user_id}-${sending.email}`}>
                                        <td className="p-3 text-foreground">{sending.user_id}</td>
                                        <td className="p-3 text-foreground">{sending.email}</td>
                                        <td className="p-3 text-foreground">{sending.status}</td>
                                        <td className="p-3 text-foreground">{formatDateTime(sending.sent_at)}</td>
                                        <td className="p-3 text-foreground">{formatDateTime(sending.opened_at)}</td>
                                        <td className="p-3 text-foreground">{formatDateTime(sending.clicked_at)}</td>
                                        <td className="p-3 text-foreground">{formatDateTime(sending.phished_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
