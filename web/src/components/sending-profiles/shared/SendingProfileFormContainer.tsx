import SendingProfileFormStepper from "@/components/sending-profiles/shared/SendingProfileFormStepper";
import { useSendingProfileForm } from "@/components/sending-profiles/shared/useSendingProfileForm";

type SendingProfileFormState = ReturnType<typeof useSendingProfileForm>;

interface SendingProfileFormContainerProps {
    form: SendingProfileFormState;
    mode: "create" | "edit";
    onSubmit: () => Promise<boolean>;
}

export default function SendingProfileFormContainer({
    form,
    mode,
    onSubmit
}: Readonly<SendingProfileFormContainerProps>) {
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
            mode={mode}
            onSubmit={onSubmit}
            testPassed={form.testPassed}
            hasChangesSinceLastTest={form.hasChangesSinceLastTest}
            isFullyValid={form.isFullyValid}
            smtpConfigChanged={mode === "create" ? true : form.smtpConfigChanged}
        />
    );
}