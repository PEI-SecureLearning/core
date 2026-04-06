import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

import CampaignStepperFlow from "@/components/campaigns/new-campaign/CampaignStepperFlow";
import {
    CampaignProvider,
    type CampaignCreatePayload
} from "@/components/campaigns/new-campaign/CampaignContext";
import {
    fetchOrgManagerCampaignSendings,
    fetchOrgManagerCampaignDetail,
    type CampaignDetail,
    type CampaignUserSending,
    updateOrgManagerCampaign
} from "@/services/campaignsApi";
import { userGroupsApi } from "@/services/userGroupsApi";
import type { UserGroupMemberDto } from "@/types/userGroups";

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

function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}

function formatSeconds(value?: number | null): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
        return "-";
    }

    if (value < 60) {
        return `${Math.round(value)}s`;
    }

    const minutes = Math.floor(value / 60);
    const seconds = Math.round(value % 60);
    return `${minutes}m ${seconds}s`;
}

export default function CampaignEditPage() {
    const { id: campaignId } = useParams({ from: "/campaigns/$id/edit" });
    const navigate = useNavigate();
    const { keycloak } = useKeycloak();

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [sendings, setSendings] = useState<CampaignUserSending[]>([]);
    const [sendingsLoadError, setSendingsLoadError] = useState<string | null>(null);
    const [loadingSendings, setLoadingSendings] = useState(false);
    const [groupDetails, setGroupDetails] = useState<CampaignGroupWithMembers[]>([]);
    const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);

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

    const fetchSendings = useCallback(async () => {
        if (!realm || !campaignId) {
            setSendings([]);
            setSendingsLoadError("Missing campaign context.");
            setLoadingSendings(false);
            return;
        }

        setLoadingSendings(true);
        setSendingsLoadError(null);

        try {
            const campaignSendings = await fetchOrgManagerCampaignSendings(
                realm,
                campaignId,
                keycloak.token
            );
            setSendings(campaignSendings);
        } catch (error) {
            setSendings([]);
            setSendingsLoadError(
                error instanceof Error ? error.message : "Failed to load campaign sendings."
            );
        } finally {
            setLoadingSendings(false);
        }
    }, [campaignId, keycloak.token, realm]);

    useEffect(() => {
        void fetchSendings();
    }, [fetchSendings]);

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

    const totalRecipients = campaign?.total_recipients ?? 0;
    const totalSendings = sendings.length;
    const successfullySent = sendings.filter((sending) => Boolean(sending.sent_at)).length;

    const handleUpdateCampaign = useCallback(
        async (payload: CampaignCreatePayload): Promise<boolean> => {
            if (!realm) {
                setSubmitError("Missing campaign context.");
                return false;
            }

            setIsSubmitting(true);
            setSubmitError(null);

            try {
                await updateOrgManagerCampaign(realm, campaignId, payload, keycloak.token);
                toast.success("Campaign updated successfully!");
                navigate({ to: "/campaigns" });
                return true;
            } catch (error) {
                const message =
                    error instanceof Error && error.message
                        ? error.message
                        : "Failed to update campaign.";
                setSubmitError(message);
                return false;
            } finally {
                setIsSubmitting(false);
            }
        },
        [campaignId, keycloak.token, navigate, realm]
    );

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
            <div className="h-full w-full bg-background  space-y-6">
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
        <div className="h-full w-full bg-background  space-y-6 overflow-auto">
            {loadError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{loadError}</span>
                </div>
            )}

            {submitError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{submitError}</span>
                </div>
            )}

            {isEditable ? (
                <CampaignProvider
                    initialData={{
                        name: campaign.name,
                        description: campaign.description ?? "",
                        begin_date: campaign.begin_date,
                        end_date: campaign.end_date,
                        sending_interval_seconds: campaign.sending_interval_seconds,
                        user_group_ids: campaign.user_group_ids,
                        phishing_kit_ids: campaign.phishing_kit_ids,
                        sending_profile_ids: campaign.sending_profile_ids
                    }}
                >
                    <div className="h-full min-h-[620px]">
                        <CampaignStepperFlow
                            onStepChange={(step) => console.log("Step:", step)}
                            onSubmitPayload={handleUpdateCampaign}
                            isSubmitting={isSubmitting}
                            backButtonText="Previous"
                            nextButtonText="Next"
                        />
                    </div>
                </CampaignProvider>
            ) : (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 text-warning">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div>
                            <p className="font-semibold">Editing is disabled</p>
                            <p className="text-sm mt-1">
                                Only campaigns with status <strong>scheduled</strong> can be edited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Campaign detail snapshot</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Realm</p>
                        <p className="font-medium mt-1">{campaign.realm_name || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Creator</p>
                        <p className="font-medium mt-1">{campaign.creator_email || campaign.creator_id || "-"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Send interval</p>
                        <p className="font-medium mt-1">{campaign.sending_interval_seconds}s</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Recipients</p>
                        <p className="font-medium mt-1">{campaign.total_recipients}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Sent / Failed</p>
                        <p className="font-medium mt-1">{campaign.total_sent} / {campaign.total_failed}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Opened / Clicked / Phished</p>
                        <p className="font-medium mt-1">{campaign.total_opened} / {campaign.total_clicked} / {campaign.total_phished}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Delivery rate</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.delivery_rate)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Open rate</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.open_rate)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Click rate</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.click_rate)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Phish rate</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.phish_rate)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Progress</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.progress_percentage)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Time elapsed</p>
                        <p className="font-medium mt-1">{formatPercent(campaign.time_elapsed_percentage)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Avg. time to open</p>
                        <p className="font-medium mt-1">{formatSeconds(campaign.avg_time_to_open_seconds)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">Avg. time to click</p>
                        <p className="font-medium mt-1">{formatSeconds(campaign.avg_time_to_click_seconds)}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">First / Last open</p>
                        <p className="font-medium mt-1">
                            {formatDateTime(campaign.first_open_at)} / {formatDateTime(campaign.last_open_at)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3">
                        <p className="text-muted-foreground">First / Last click</p>
                        <p className="font-medium mt-1">
                            {formatDateTime(campaign.first_click_at)} / {formatDateTime(campaign.last_click_at)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Target groups and users</h2>
                <p className="text-sm text-muted-foreground">
                    {groupDetails.length} group(s), {groupDetails.reduce((acc, group) => acc + group.members.length, 0)} total listed members.
                </p>

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {groupDetails.map((group) => (
                        <div key={group.id} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                            <div>
                                <p className="text-xs uppercase text-muted-foreground tracking-wide">Group</p>
                                <p className="font-medium text-foreground mt-1">{group.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">{group.members.length} member(s)</p>
                            </div>
                            <div className="max-h-44 overflow-auto rounded-md border border-border/60 bg-background">
                                {group.members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-3">No members found in this group.</p>
                                ) : (
                                    <ul className="divide-y divide-border/60 text-sm">
                                        {group.members.map((member) => (
                                            <li key={`${group.id}-${member.id || member.email || member.username}`} className="p-3">
                                                <p className="font-medium text-foreground">{member.username || member.email || member.id || "Unknown user"}</p>
                                                <p className="text-muted-foreground text-xs mt-1">{member.email || "No email"}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Email sendings</h2>
                <p className="text-sm text-muted-foreground">
                    {totalSendings} total records, {successfullySent} sent, {Math.max(totalRecipients - successfullySent, 0)} pending/unsent.
                </p>

                {loadingSendings && (
                    <div className="text-sm text-muted-foreground">Loading sendings...</div>
                )}

                {sendingsLoadError && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                        {sendingsLoadError}
                    </div>
                )}

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
                            {!loadingSendings && sendings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-4 text-muted-foreground">
                                        No sending records available for this campaign.
                                    </td>
                                </tr>
                            ) : (
                                sendings.map((sending) => (
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
