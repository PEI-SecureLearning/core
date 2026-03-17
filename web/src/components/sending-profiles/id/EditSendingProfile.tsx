import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import SendingProfileFormStepper from "@/components/sending-profiles/shared/SendingProfileFormStepper";
import { useSendingProfileForm } from "@/components/sending-profiles/shared/useSendingProfileForm";
import {
  fetchSendingProfileById,
  updateSendingProfile
} from "@/services/sendingProfilesApi";

export default function EditSendingProfile() {
  const navigate = useNavigate();
  const { id: paramId } = useParams({ from: "/sending-profiles/$id" });
  const profileId = Number(paramId);

  const form = useSendingProfileForm();

  const [isFetching, setIsFetching] = useState(true);

  // ── Load existing profile data ────────────────────────────────────────────
  useEffect(() => {
    if (!form.realm || !profileId) return;

    const load = async () => {
      try {
        setIsFetching(true);
        const data = await fetchSendingProfileById(
          form.realm,
          profileId,
          form.keycloak.token
        );

        form.setName(data.name);
        form.setFromFname(data.from_fname);
        form.setFromLname(data.from_lname);
        form.setFromEmail(data.from_email);
        form.setSmtpHost(data.smtp_host);
        form.setSmtpPort(data.smtp_port);
        form.setUsername(data.username);
        // Never prefill SMTP password in edit mode.
        form.setPassword("");
        // Store original SMTP config to detect if user changed it
        form.setOriginalSmtpValues(
          data.smtp_host,
          data.smtp_port,
          data.username
        );
        if (data.custom_headers) form.setCustomHeaders(data.custom_headers);
      } catch {
        form.setStatus("Failed to load profile data.");
      } finally {
        setIsFetching(false);
      }
    };

    load();
    // form setters are stable, only re-run when realm/id/token change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.realm, profileId, form.keycloak.token]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.realm || !form.isBasicValid) {
      form.setStatus("Please fill in required fields.");
      return false;
    }

    form.setIsLoading(true);
    form.setStatus(null);

    try {
      await updateSendingProfile(
        form.realm,
        profileId,
        form.buildPayload(),
        form.keycloak.token
      );
      form.setStatus("Profile updated successfully!");
      setTimeout(() => navigate({ to: "/sending-profiles" }), 800);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile.";
      form.setStatus(message);
      return false;
    } finally {
      form.setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface-subtle">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/90 mx-auto mb-2" />
          <p className="text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <SendingProfileFormStepper
      name={form.name}
      setName={form.setName}
      fromFname={form.fromFname}
      setFromFname={form.setFromFname}
      fromLname={form.fromLname}
      setFromLname={form.setFromLname}
      fromEmail={form.fromEmail}
      setFromEmail={form.setFromEmail}
      smtpHost={form.smtpHost}
      setSmtpHost={form.setSmtpHost}
      smtpPort={form.smtpPort}
      setSmtpPort={form.setSmtpPort}
      username={form.username}
      setUsername={form.setUsername}
      password={form.password}
      setPassword={form.setPassword}
      customHeaders={form.customHeaders}
      onAddHeader={form.addHeader}
      onRemoveHeader={form.removeHeader}
      onTest={form.handleTest}
      isTesting={form.isTesting}
      testStatus={form.testStatus}
      isLoading={form.isLoading}
      status={form.status}
      setStatus={form.setStatus}
      mode="edit"
      onSubmit={handleSave}
      testPassed={form.testPassed}
      hasChangesSinceLastTest={form.hasChangesSinceLastTest}
      smtpConfigChanged={form.smtpConfigChanged}
    />
  );
}
