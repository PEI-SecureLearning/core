import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import SendingProfileLayout from "@/components/sending-profiles/shared/SendingProfileLayout";
import ProfileFooter from "@/components/sending-profiles/new/ProfileFooter";
import { useSendingProfileForm } from "@/components/sending-profiles/shared/useSendingProfileForm";
import { createSendingProfile } from "@/services/sendingProfilesApi";

export default function NewSendingProfile() {
  const navigate = useNavigate();
  const form = useSendingProfileForm();

  const handleSubmit = async () => {
    if (!form.testPassed) {
      toast.warning("Please test the configuration first before creating the profile.");
      return;
    }

    if (!form.realm) {
      form.setStatus("Error: Could not determine Realm. Are you logged in?");
      return;
    }

    if (!form.isFullyValid) {
      form.setStatus("Please fill in all required fields.");
      return;
    }

    form.setIsLoading(true);
    form.setStatus(null);

    try {
      await createSendingProfile(form.realm, form.buildPayload(), form.keycloak.token);
      form.setStatus("Profile created successfully!");
      setTimeout(() => navigate({ to: "/sending-profiles" }), 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create profile. Check connection.";
      form.setStatus(message);
    } finally {
      form.setIsLoading(false);
    }
  };

  return (
    <SendingProfileLayout
      title="New Sending Profile"
      subtitle="Configure identity and SMTP settings"
      name={form.name} setName={form.setName}
      fromFname={form.fromFname} setFromFname={form.setFromFname}
      fromLname={form.fromLname} setFromLname={form.setFromLname}
      fromEmail={form.fromEmail} setFromEmail={form.setFromEmail}
      smtpHost={form.smtpHost} setSmtpHost={form.setSmtpHost}
      smtpPort={form.smtpPort} setSmtpPort={form.setSmtpPort}
      username={form.username} setUsername={form.setUsername}
      password={form.password} setPassword={form.setPassword}
      onTest={form.handleTest}
      isTesting={form.isTesting}
      testStatus={form.testStatus}
      customHeaders={form.customHeaders}
      onAddHeader={form.addHeader}
      onRemoveHeader={form.removeHeader}
      footer={
        <ProfileFooter
          onSubmit={handleSubmit}
          isValid={form.isFullyValid}
          isLoading={form.isLoading}
          status={form.status}
        />
      }
    />
  );
}
