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
    fetchOrgManagerCampaignDetail,
    type CampaignDetail,
    updateOrgManagerCampaign
} from "@/services/campaignsApi";

function getRealmFromToken(tokenParsed: unknown): string | null {
    const iss = (tokenParsed as { iss?: string } | undefined)?.iss;
    if (!iss) return null;
    const parts = iss.split("/realms/");
    return parts[1] ?? null;
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
                    <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700">
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
        </div>
    );
}
