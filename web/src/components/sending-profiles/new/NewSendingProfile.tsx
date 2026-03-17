import { useNavigate } from "@tanstack/react-router";

import SendingProfileFormStepper from "@/components/sending-profiles/shared/SendingProfileFormStepper";
import { useSendingProfileForm } from "@/components/sending-profiles/shared/useSendingProfileForm";
import { createSendingProfile } from "@/services/sendingProfilesApi";

export default function NewSendingProfile() {
  const navigate = useNavigate();
  const form = useSendingProfileForm();

  const handleSubmit = async () => {
    if (!form.realm) {
      form.setStatus("Error: Could not determine Realm. Are you logged in?");
      return false;
    }

    form.setIsLoading(true);
    form.setStatus(null);

    try {
      await createSendingProfile(
        form.realm,
        form.buildPayload(),
        form.keycloak.token
      );
      form.setStatus("Profile created successfully!");
      setTimeout(() => navigate({ to: "/sending-profiles" }), 1000);
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create profile. Check connection.";
      form.setStatus(message);
      return false;
    } finally {
      form.setIsLoading(false);
    }
  };

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
      mode="create"
      onSubmit={handleSubmit}
      testPassed={form.testPassed}
      hasChangesSinceLastTest={form.hasChangesSinceLastTest}
      isFullyValid={form.isFullyValid}
      smtpConfigChanged={true}
    />
  );
}
