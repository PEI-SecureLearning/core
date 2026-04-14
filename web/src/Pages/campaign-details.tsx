import { Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { AlertTriangle, ChevronLeft, Clock3, Lock, Pencil } from "lucide-react";

import { SummaryCollapsibleCard } from "@/components/campaigns/SummaryCollapsibleCard";
import RefreshButton from "@/components/shared/RefreshButton";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    fetchOrgManagerCampaignSendings,
    fetchOrgManagerCampaignDetail,
    type CampaignDetail,
    type CampaignUserSending
} from "@/services/campaignsApi";
import { fetchPhishingKits } from "@/services/phishingKitsApi";
import { fetchSendingProfiles } from "@/services/sendingProfilesApi";
import { userGroupsApi } from "@/services/userGroupsApi";
import type { PhishingKitDisplayInfo } from "@/types/phishingKit";
import type { SendingProfileDisplayInfo } from "@/types/sendingProfile";
import type { UserGroupMemberDto } from "@/types/userGroups";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, CartesianGrid, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

interface CampaignGroupWithMembers {
    id: string;
    name: string;
    members: UserGroupMemberDto[];
}

const statsChartConfig = {
    phished: {
        label: "Phished",
        color: "var(--primary)",
    },
    clicked: {
        label: "Clicked",
        color: "var(--primary)",
    },
    opened: {
        label: "Opened",
        color: "var(--primary)",
    },
    sent: {
        label: "Sent",
        color: "var(--primary)",
    },
    failed: {
        label: "Failed",
        color: "var(--error)",
    },
} satisfies ChartConfig;

const completionChartConfig = {
    completed: {
        label: "Sent",
        color: "var(--primary)",
    },
    remaining: {
        label: "Remaining",
        color: "var(--muted)",
    },
} satisfies ChartConfig;

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

const SectionSeparator = ({ title }: { title: string }) =>
    <div className="flex items-center gap-3">
        <span className="shrink-0 whitespace-nowrap text-xs font-semibold uppercase tracking-widest1 text-primary">
            {title}
        </span>
        <Separator className="flex-1 bg-primary/70 self-center" />
    </div>

const StatDisplay = ({ label, value }: { label: string, value: string | number }) =>
    <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-4xl font-semibold text-primary">{value}</p>
    </div>

interface SummaryListStateProps<T> {
    loading: boolean;
    error: string | null;
    items: T[];
    loadingMessage: string;
    emptyMessage: string;
    itemsContainerClassName: string;
    renderItem: (item: T, index: number) => ReactNode;
}

const SummaryListState = <T,>({
    loading,
    error,
    items,
    loadingMessage,
    emptyMessage,
    itemsContainerClassName,
    renderItem,
}: SummaryListStateProps<T>) => {
    if (loading) {
        return <div className="text-sm text-muted-foreground">{loadingMessage}</div>;
    }

    if (error) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                {error}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return <div className={itemsContainerClassName}>{items.map((item, index) => renderItem(item, index))}</div>;
};


export default function CampaignDetails() {
    const { id: campaignId } = useParams({ from: "/campaigns/$id" });
    const { keycloak } = useKeycloak();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [sendings, setSendings] = useState<CampaignUserSending[]>([]);
    const [loadingSendings, setLoadingSendings] = useState(false);
    const [sendingsLoadError, setSendingsLoadError] = useState<string | null>(null);
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
        fetchSendings();
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
    const sentCount = campaign?.total_sent ?? sendings.filter((sending) => Boolean(sending.sent_at)).length ?? 0;
    const openedCount = campaign?.total_opened ?? sendings.filter((sending) => Boolean(sending.opened_at)).length ?? 0;
    const clickedCount = campaign?.total_clicked ?? sendings.filter((sending) => Boolean(sending.clicked_at)).length ?? 0;
    const phishedCount = campaign?.total_phished ?? sendings.filter((sending) => Boolean(sending.phished_at)).length ?? 0;
    const failedCount = campaign?.total_failed ?? sendings.filter((sending) => sending.status?.toLowerCase() === "failed").length ?? 0;
    const completionPercent = Math.max(0, Math.min(campaign?.progress_percentage ?? 0, 100));
    const completedRecipients = Math.round((completionPercent / 100) * totalRecipients);
    const remainingRecipients = Math.max(totalRecipients - completedRecipients, 0);

    const statsChartData = [
        { metric: "phished", label: "Phished", users: phishedCount, fill: "var(--color-phished)" },
        { metric: "clicked", label: "Clicked", users: clickedCount, fill: "var(--color-clicked)" },
        { metric: "opened", label: "Opened", users: openedCount, fill: "var(--color-opened)" },
        { metric: "sent", label: "Sent", users: sentCount, fill: "var(--color-sent)" },
        { metric: "failed", label: "Failed", users: failedCount, fill: "var(--color-failed)" },
    ];

    const completionChartData = [
        {
            key: "completed",
            name: "Sent",
            value: completedRecipients,
            fill: "var(--color-completed)",
        },
        {
            key: "remaining",
            name: "Remaining",
            value: remainingRecipients,
            fill: "var(--color-remaining)",
        },
    ];

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

                <div className="flex items-center gap-2">
                    <RefreshButton
                        onClick={() => {
                            fetchCampaign();
                            fetchSendings();
                        }}
                        isRefreshing={loading}
                        disabled={loading || loadingSendings}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                    />

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
            </div>

            {loadError && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{loadError}</span>
                </div>
            )}

            <SectionSeparator title="Details" />

            <div className="grid grid-cols-12 gap-4 text-sm">

                <div className="col-span-12 lg:col-span-4 sm:col-span-6 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Start</p>
                    <p className="text-foreground mt-1 text-wrap">
                        {new Date(campaign.begin_date).toLocaleString()}
                    </p>
                </div>

                <div className="col-span-12 lg:col-span-4 sm:col-span-6 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">End</p>
                    <p className="text-foreground mt-1 text-wrap">
                        {new Date(campaign.end_date).toLocaleString()}
                    </p>
                </div>

                <div className="col-span-12 lg:col-span-4 rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Send interval</p>
                    <p className="text-foreground mt-1">
                        Every {Math.max(1, Math.floor(campaign.sending_interval_seconds / 60))} minute(s)
                    </p>
                </div>

                <SummaryCollapsibleCard
                    className="col-span-12 lg:col-span-4"
                    title={`Target groups: ${groupDetails.length}`}
                    subtitle={`Targeted users: ${totalRecipients}`}
                >
                    <div className="space-y-4">
                        <SummaryListState
                            loading={loadingGroups}
                            error={groupLoadError}
                            items={groupDetails}
                            loadingMessage="Loading group memberships..."
                            emptyMessage="No user groups linked to this campaign."
                            itemsContainerClassName="grid grid-cols-1 gap-4"
                            renderItem={(group) => (
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
                            )}
                        />
                    </div>
                </SummaryCollapsibleCard>

                <SummaryCollapsibleCard
                    className="col-span-12 md:col-span-6 lg:col-span-4"
                    title={`Phishing kits: ${phishingKitDetails.length}`}

                >
                    <div className="space-y-4">
                        <SummaryListState
                            loading={loadingPhishingKits}
                            error={phishingKitLoadError}
                            items={phishingKitDetails}
                            loadingMessage="Loading phishing kits..."
                            emptyMessage="No phishing kits linked to this campaign."
                            itemsContainerClassName="space-y-3"
                            renderItem={(kit) => (
                                <div key={kit.id} className="rounded-xl border border-border bg-surface p-4 flex items-start align-middle gap-3">

                                    <div>
                                        <p className="font-medium text-foreground">{kit.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {kit.description?.trim() || "No description"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </SummaryCollapsibleCard>

                <SummaryCollapsibleCard
                    className="col-span-12 md:col-span-6 lg:col-span-4"
                    title={`Sending profiles: ${sendingProfileDetails.length}`}
                >
                    <div className="space-y-4">
                        <SummaryListState
                            loading={loadingSendingProfiles}
                            error={sendingProfileLoadError}
                            items={sendingProfileDetails}
                            loadingMessage="Loading sending profiles..."
                            emptyMessage="No sending profiles linked to this campaign."
                            itemsContainerClassName="space-y-3"
                            renderItem={(profile) => (
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
                            )}
                        />
                    </div>
                </SummaryCollapsibleCard>

            </div>

            <SectionSeparator title="Stats" />

            <div className="grid grid-cols-3 gap-4">
                <StatDisplay label="Open Rate" value={formatPercent(campaign.open_rate)} />
                <StatDisplay label="Click Rate" value={formatPercent(campaign.click_rate)} />
                <StatDisplay label="Phish Rate" value={formatPercent(campaign.phish_rate)} />

                <div className="col-span-full lg:col-span-2 rounded-2xl border border-border bg-card p-6 space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-foreground">Campaign activity</h2>
                        <p className="text-sm text-muted-foreground">
                            Sent, engagement, and outcome totals for this campaign.
                        </p>
                    </div>

                    <ChartContainer config={statsChartConfig} className="h-[260px] w-full">
                        <BarChart
                            accessibilityLayer
                            data={statsChartData}
                            layout="vertical"
                            margin={{ top: 4, right: 30, left: 4, bottom: 4 }}
                        >
                            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="label"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={72}
                                tickMargin={8}
                                className="text-xs fill-muted-foreground"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="users" radius={8}>
                                <LabelList
                                    dataKey="users"
                                    position="right"
                                    offset={8}
                                    className="fill-foreground text-xs"
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>

                <div className="col-span-full lg:col-span-1 rounded-2xl border border-border bg-card p-6 space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Completion progress</h3>

                    <div className="relative mx-auto h-[230px] w-full max-w-[320px]">
                        <ChartContainer config={completionChartConfig} className="h-full w-full">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={completionChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={64}
                                    outerRadius={92}
                                    strokeWidth={4}
                                />
                            </PieChart>
                        </ChartContainer>

                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-semibold text-foreground">{formatPercent(completionPercent)}</span>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground"> {completedRecipients}/{totalRecipients} Sent</span>
                        </div>
                    </div>


                </div>

            </div>

            <SectionSeparator title="Email sendings" />

            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="min-w-full text-sm">
                    <thead className="bg-surface-subtle text-muted-foreground">
                        <tr>
                            <th className="text-left font-medium p-3">Email</th>
                            <th className="text-left font-medium p-3">Status</th>
                            <th className="text-left font-medium p-3">Error</th>
                            <th className="text-left font-medium p-3">Sent</th>
                            <th className="text-left font-medium p-3">Opened</th>
                            <th className="text-left font-medium p-3">Clicked</th>
                            <th className="text-left font-medium p-3">Phished</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {(() => {
                            if (loadingSendings) {
                                return (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-muted-foreground">
                                            Loading sending records...
                                        </td>
                                    </tr>
                                );
                            }

                            if (sendingsLoadError) {
                                return (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-error">
                                            {sendingsLoadError}
                                        </td>
                                    </tr>
                                );
                            }

                            if (sendings.length === 0) {
                                return (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-muted-foreground">
                                            No sending records available for this campaign.
                                        </td>
                                    </tr>
                                );
                            }

                            return sendings.map((sending) => (
                                <tr key={`${sending.user_id}-${sending.email}`}>
                                    <td className="p-3 text-primary">
                                        <Link
                                            // TODO: Once user details page is implemented, link to user details instead of tenants org manager
                                            to="/tenants-org-manager"
                                            className="text-primary underline"
                                        >
                                            {sending.email}
                                        </Link>
                                    </td>
                                    <td className="p-3 text-foreground">{sending.status}</td>
                                    <td className="p-3 text-foreground">
                                        {sending.status === "failed" && sending.error_cause
                                            ? sending.error_cause
                                            : "—"}
                                    </td>
                                    <td className="p-3 text-foreground">{formatDateTime(sending.sent_at)}</td>
                                    <td className="p-3 text-foreground">{formatDateTime(sending.opened_at)}</td>
                                    <td className="p-3 text-foreground">{formatDateTime(sending.clicked_at)}</td>
                                    <td className="p-3 text-foreground">{formatDateTime(sending.phished_at)}</td>
                                </tr>
                            ));
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
