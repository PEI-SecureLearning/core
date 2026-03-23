import { Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { AlertTriangle, ChevronLeft, Clock3, Lock, Pencil } from "lucide-react";

import {
    fetchOrgManagerCampaignDetail,
    type CampaignDetail
} from "@/services/campaignsApi";

function getRealmFromToken(tokenParsed: unknown): string | null {
    const iss = (tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
}

export default function CampaignDetails() {
    const { id: campaignId } = useParams({ from: "/campaigns/$id" });
    const { keycloak } = useKeycloak();

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);

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
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <Link
                        to="/campaigns"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft size={16} />
                        Back to campaigns
                    </Link>

                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                        Campaign Details
                    </h1>

                    <p className="text-sm text-muted-foreground">{campaign.name}</p>
                </div>

                <div className="flex items-center gap-3">
                     <div
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${isEditable
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-warning/30 bg-warning/10 text-warning"
                            }`}
                    >
                        {isEditable ? <Clock3 size={15} /> : <Lock size={15} />}
                        Status: <span className="uppercase">{campaign.status}</span>
                    </div>

                    {isEditable && (
                        <Link
                            to="/campaigns/$id/edit"
                            params={{ id: campaignId }}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Pencil size={14} />
                            Edit campaign
                        </Link>
                    )}
                </div>
            </div>

            {loadError && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{loadError}</span>
                </div>
            )}

            {!isEditable && (
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning">
                        <AlertTriangle size={16} className="mt-0.5" />
                        <div>
                            <p className="font-semibold">Editing is disabled</p>
                            <p className="text-sm mt-1">
                                Only campaigns with status <strong>scheduled</strong> can be
                                edited.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Campaign name</p>
                    <p className="text-foreground font-medium mt-1">{campaign.name}</p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Description</p>
                    <p className="text-foreground mt-1 whitespace-pre-wrap">
                        {campaign.description || "No description"}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Start</p>
                    <p className="text-foreground mt-1">
                        {new Date(campaign.begin_date).toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">End</p>
                    <p className="text-foreground mt-1">
                        {new Date(campaign.end_date).toLocaleString()}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Send interval</p>
                    <p className="text-foreground mt-1">
                        Every {Math.max(1, Math.floor(campaign.sending_interval_seconds / 60))} minute(s)
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Target groups</p>
                    <p className="text-foreground mt-1">
                        {campaign.user_group_ids.length} selected
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Phishing kits</p>
                    <p className="text-foreground mt-1">
                        {campaign.phishing_kit_names.length > 0
                            ? campaign.phishing_kit_names.join(", ")
                            : "None"}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-muted-foreground">Sending profiles</p>
                    <p className="text-foreground mt-1">
                        {campaign.sending_profile_names.length > 0
                            ? campaign.sending_profile_names.join(", ")
                            : "None"}
                    </p>
                </div>
            </div>
        </div>
    );
}
