import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  Clock3,
  FileText,
  Info,
  Lock,
  Save
} from "lucide-react";

import Stepper, { Step } from "@/components/ui/Stepper";
import {
  fetchOrgManagerCampaignDetail,
  updateOrgManagerCampaign
} from "@/services/campaignsApi";
import type { CampaignDetail } from "@/services/campaignsApi";

interface CampaignEditForm {
  name: string;
  description: string;
  beginAt: string;
  endAt: string;
  intervalMinutes: number;
}

function getRealmFromToken(tokenParsed: unknown): string | null {
  const iss = (tokenParsed as { iss?: string } | undefined)?.iss;
  if (!iss) return null;
  const parts = iss.split("/realms/");
  return parts[1] ?? null;
}

function toLocalDateTimeInputValue(isoDate: string): string {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoOrNull(localDateTime: string): string | null {
  const date = new Date(localDateTime);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

export default function CampaignDetails() {
  const { id: paramId } = useParams({ from: "/campaigns/$id" });
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [formData, setFormData] = useState<CampaignEditForm | null>(null);

  const realm = useMemo(
    () => getRealmFromToken(keycloak.tokenParsed),
    [keycloak.tokenParsed]
  );

  const isEditable = campaign?.status === "scheduled";

  const fetchCampaign = useCallback(async () => {
    if (!realm || !paramId) {
      setLoadError("Missing campaign context.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const detail = await fetchOrgManagerCampaignDetail(
        realm,
        paramId,
        keycloak.token
      );

      setCampaign(detail);
      setFormData({
        name: detail.name,
        description: detail.description ?? "",
        beginAt: toLocalDateTimeInputValue(detail.begin_date),
        endAt: toLocalDateTimeInputValue(detail.end_date),
        intervalMinutes: Math.max(
          1,
          Math.floor((detail.sending_interval_seconds ?? 60) / 60)
        )
      });
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load campaign."
      );
    } finally {
      setLoading(false);
    }
  }, [keycloak.token, paramId, realm]);

  useEffect(() => {
    void fetchCampaign();
  }, [fetchCampaign]);

  const validateStep = useCallback(
    (step: number): boolean => {
      if (!formData) return false;

      if (step === 1) {
        if (!formData.name.trim()) {
          setSubmitError("Campaign name is required.");
          return false;
        }
      }

      if (step === 2) {
        const startIso = toIsoOrNull(formData.beginAt);
        const endIso = toIsoOrNull(formData.endAt);

        if (!startIso || !endIso) {
          setSubmitError("Start and end date/time are required.");
          return false;
        }

        if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
          setSubmitError("End date/time must be after start date/time.");
          return false;
        }

        if (formData.intervalMinutes < 1) {
          setSubmitError("Send interval must be at least 1 minute.");
          return false;
        }
      }

      setSubmitError(null);
      return true;
    },
    [formData]
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!realm || !paramId || !formData || !campaign || !isEditable) {
      return false;
    }

    const beginIso = toIsoOrNull(formData.beginAt);
    const endIso = toIsoOrNull(formData.endAt);

    if (!beginIso || !endIso) {
      setSubmitError("Start and end date/time are required.");
      return false;
    }

    if (new Date(endIso).getTime() <= new Date(beginIso).getTime()) {
      setSubmitError("End date/time must be after start date/time.");
      return false;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await updateOrgManagerCampaign(
        realm,
        paramId,
        {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          begin_date: beginIso,
          end_date: endIso,
          sending_interval_seconds: formData.intervalMinutes * 60,
          user_group_ids: campaign.user_group_ids,
          phishing_kit_ids: campaign.phishing_kit_ids,
          sending_profile_ids: campaign.sending_profile_ids
        },
        keycloak.token
      );

      navigate({ to: "/campaigns" });
      return true;
    } catch (error) {
      let msg = "Failed to save campaign.";
      if (error instanceof Error && error.message) {
        msg = error.message;
      }
      setSubmitError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    campaign,
    formData,
    isEditable,
    keycloak.token,
    navigate,
    paramId,
    realm
  ]);

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

  if (!campaign || !formData) {
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
            Campaign Editor
          </h1>

          <p className="text-sm text-muted-foreground">
            Edit campaign settings with a guided step-by-step flow.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
            isEditable
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-amber-500/30 bg-amber-500/10 text-amber-600"
          }`}
        >
          {isEditable ? <Clock3 size={15} /> : <Lock size={15} />}
          Status: <span className="uppercase">{campaign.status}</span>
        </div>
      </div>

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
        <div className="h-[calc(100vh-14rem)] min-h-[620px]">
          <Stepper
            initialStep={1}
            validateStep={validateStep}
            onBeforeComplete={handleSave}
            nextButtonText="Next"
            backButtonText="Previous"
            stepIcons={[FileText, CalendarDays, Save]}
            stepCompletedIcons={[FileText, CalendarDays, Save]}
            nextButtonProps={{ disabled: saving }}
            backButtonProps={{ disabled: saving }}
          >
            <Step>
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Basic Information
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update campaign title and description.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="campaign-name"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Campaign name
                  </label>
                  <input
                    id="campaign-name"
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev ? { ...prev, name: event.target.value } : prev
                      )
                    }
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="Enter campaign name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="campaign-description"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="campaign-description"
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev
                          ? { ...prev, description: event.target.value }
                          : prev
                      )
                    }
                    className="w-full min-h-36 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
                    placeholder="Optional campaign description"
                  />
                </div>
              </div>
            </Step>

            <Step>
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Schedule
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set delivery window and send cadence.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="campaign-begin-at"
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      Start date and time
                    </label>
                    <input
                      id="campaign-begin-at"
                      type="datetime-local"
                      value={formData.beginAt}
                      onChange={(event) =>
                        setFormData((prev) =>
                          prev ? { ...prev, beginAt: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="campaign-end-at"
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    >
                      End date and time
                    </label>
                    <input
                      id="campaign-end-at"
                      type="datetime-local"
                      value={formData.endAt}
                      onChange={(event) =>
                        setFormData((prev) =>
                          prev ? { ...prev, endAt: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <label
                    htmlFor="campaign-interval"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    Send interval (minutes)
                  </label>
                  <input
                    id="campaign-interval"
                    type="number"
                    min={1}
                    value={formData.intervalMinutes}
                    onChange={(event) =>
                      setFormData((prev) =>
                        prev
                          ? {
                              ...prev,
                              intervalMinutes: Math.max(
                                1,
                                Number.parseInt(event.target.value, 10) || 1
                              )
                            }
                          : prev
                      )
                    }
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </Step>

            <Step>
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Review and Save
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confirm updates before applying changes.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="text-foreground font-medium mt-1">
                      {formData.name || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="text-foreground mt-1 whitespace-pre-wrap">
                      {formData.description || "No description"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground">Start</p>
                      <p className="text-foreground mt-1">
                        {formData.beginAt
                          ? new Date(formData.beginAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p className="text-foreground mt-1">
                        {formData.endAt
                          ? new Date(formData.endAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Send interval</p>
                    <p className="text-foreground mt-1">
                      Every {formData.intervalMinutes} minute(s)
                    </p>
                  </div>

                  {!!campaign.phishing_kit_names?.length && (
                    <div>
                      <p className="text-muted-foreground">
                        Linked phishing kits
                      </p>
                      <p className="text-foreground mt-1">
                        {campaign.phishing_kit_names.join(", ")}
                      </p>
                    </div>
                  )}

                  {!!campaign.sending_profile_names?.length && (
                    <div>
                      <p className="text-muted-foreground">
                        Linked sending profiles
                      </p>
                      <p className="text-foreground mt-1">
                        {campaign.sending_profile_names.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                {saving && (
                  <p className="text-sm text-muted-foreground">
                    Saving changes...
                  </p>
                )}
              </div>
            </Step>
          </Stepper>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700">
            <Info size={16} className="mt-0.5" />
            <div>
              <p className="font-semibold">Editing is disabled</p>
              <p className="text-sm mt-1">
                Only campaigns with status <strong>scheduled</strong> can be
                edited.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Campaign name</p>
              <p className="text-foreground font-medium mt-1">
                {campaign.name}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-muted-foreground">Schedule</p>
              <p className="text-foreground font-medium mt-1">
                {new Date(campaign.begin_date).toLocaleString()} to{" "}
                {new Date(campaign.end_date).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
