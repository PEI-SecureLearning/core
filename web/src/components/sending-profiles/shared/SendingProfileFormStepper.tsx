import {
  Eye,
  FileCheck2,
  Info,
  List,
  Mail,
  MailCheck,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

import ProfileBasicInfo from "@/components/sending-profiles/new/ProfileBasicInfo";
import ProfileSmtpConfig from "@/components/sending-profiles/new/ProfileSmtpConfig";
import CustomHeadersSection from "../new/CustomHeadersSection";
import SendingProfileStepSection from "@/components/sending-profiles/shared/SendingProfileStepSection";
import SendingProfileSummary from "@/components/sending-profiles/shared/SendingProfileSummary";
import Stepper, { Step } from "@/components/ui/Stepper";
import { StatusMessage } from "@/components/sending-profiles/shared/statusMessage";
import type { CustomHeader } from "@/types/sendingProfile";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SendingProfileFormStepperProps {
  name: string;
  setName: (v: string) => void;
  fromFname: string;
  setFromFname: (v: string) => void;
  fromLname: string;
  setFromLname: (v: string) => void;
  fromEmail: string;
  setFromEmail: (v: string) => void;
  smtpHost: string;
  setSmtpHost: (v: string) => void;
  smtpPort: number;
  setSmtpPort: (v: number) => void;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  customHeaders: CustomHeader[];
  onAddHeader: (h: CustomHeader) => void;
  onRemoveHeader: (index: number) => void;
  onTest: () => Promise<boolean>;
  isTesting: boolean;
  testStatus: string | null;
  isLoading: boolean;
  status: string | null;
  setStatus: (s: string | null) => void;
  mode: "create" | "edit";
  onSubmit: () => Promise<boolean>;
  testPassed: boolean;
  isFullyValid?: boolean;
  smtpConfigChanged?: boolean;
}

export default function SendingProfileFormStepper({
  name,
  setName,
  fromFname,
  setFromFname,
  fromLname,
  setFromLname,
  fromEmail,
  setFromEmail,
  smtpHost,
  setSmtpHost,
  smtpPort,
  setSmtpPort,
  username,
  setUsername,
  password,
  setPassword,
  customHeaders,
  onAddHeader,
  onRemoveHeader,
  onTest,
  isTesting,
  testStatus,
  isLoading,
  status,
  setStatus,
  mode,
  onSubmit,
  testPassed,
  isFullyValid = true,
  smtpConfigChanged = false
}: Readonly<SendingProfileFormStepperProps>) {
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        if (!name || !fromEmail) {
          toast.error("Please fill in profile name and sender email.");
          return false;
        }
        if (!EMAIL_PATTERN.test(fromEmail.trim())) {
          toast.error("Please provide a valid sender email address.");
          return false;
        }
        return true;
      case 2:
        if (!smtpHost || !username) {
          toast.error("Please fill in all required SMTP fields.");
          return false;
        }
        if (smtpConfigChanged && !password) {
          toast.error("Please fill in the password field.");
          return false;
        }
        // Keep edit behavior: if SMTP config is unchanged, allow proceeding without testing/password.
        if (!smtpConfigChanged) {
          return true;
        }
        if (testPassed) {
          return true;
        }

        return await onTest();
      case 3:
      case 4:
      default:
        return true;
    }
  };

  const handleStepperSubmit = async () => {
    if (!isFullyValid) {
      setStatus("Please fill in all required fields.");
      return false;
    }

    return await onSubmit();
  };

  const isErrorStatus = (value: string | null | undefined): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
      lower.includes("failed") ||
      lower.includes("error") ||
      lower.includes("invalid")
    );
  };

  const testFailed = testStatus && isErrorStatus(testStatus);

  const steps = [
    {
      id: "initial-info",
      content: (
        <SendingProfileStepSection
          stepNumber={1}
          title="Initial Info"
          description={
            <>Define the internal profile name and sender identity.</>
          }
          subtle={false}
        >
          <ProfileBasicInfo
            name={name}
            setName={setName}
            fromFname={fromFname}
            setFromFname={setFromFname}
            fromLname={fromLname}
            setFromLname={setFromLname}
            fromEmail={fromEmail}
            setFromEmail={setFromEmail}
          />
        </SendingProfileStepSection>
      )
    },
    {
      id: "smtp-config",
      content: (
        <SendingProfileStepSection
          stepNumber={2}
          title="SMTP Config"
          description={
            <>
              Add SMTP credentials. A background connection test runs when you
              click Next.
            </>
          }
        >
          <ProfileSmtpConfig
            host={smtpHost}
            setHost={setSmtpHost}
            port={smtpPort}
            setPort={setSmtpPort}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            isTesting={isTesting}
            testStatus={testStatus}
            smtpConfigChanged={smtpConfigChanged}
          />
        </SendingProfileStepSection>
      )
    },
    {
      id: "custom-headers",
      content: (
        <SendingProfileStepSection
          stepNumber={3}
          title="Custom Headers"
          description={
            <>Optionally add custom email headers for this sending profile.</>
          }
        >
          <CustomHeadersSection
            headers={customHeaders}
            onAddHeader={onAddHeader}
            onRemoveHeader={onRemoveHeader}
          />
        </SendingProfileStepSection>
      )
    },
    {
      id: "final-preview",
      content: (

        <SendingProfileStepSection
          stepNumber={4}
          title="Final Summary"
          description={
            <>
              Review the profile details, then click Complete to{" "}
              {mode === "create" ? "create" : "save"} it.
            </>
          }
        >
          {status && <StatusMessage status={status} />}

          {testFailed && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">
                  SMTP Test Failed
                </p>
                <p className="text-sm text-red-700">{testStatus}</p>
              </div>
            </div>
          )}

          <SendingProfileSummary
            name={name}
            fname={fromFname}
            lname={fromLname}
            fromEmail={fromEmail}
            smtpHost={smtpHost}
            smtpPort={smtpPort}
            customHeaders={customHeaders}
          />
        </SendingProfileStepSection>
      )
    }
  ];

  return (
    <div className="h-full w-full bg-background animate-fade-in overflow-hidden flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Stepper
          initialStep={1}
          validateStep={validateStep}
          onBeforeComplete={handleStepperSubmit}
          nextButtonText="Next"
          backButtonText="Previous"
          nextButtonProps={{
            disabled: isLoading
          }}
          stepIcons={[Info, Mail, List, Eye]}
          stepCompletedIcons={[CheckCircle2, MailCheck, FileCheck2, FileCheck2]}
        >
          {steps.map((step) => (
            <Step key={step.id}>{step.content}</Step>
          ))}
        </Stepper>
      </div>
    </div>
  );
}
