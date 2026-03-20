import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Stepper, { Step } from "@/components/ui/Stepper";
import { PhishingKitProvider, usePhishingKit } from "./PhishingKitContext";
import PhishingKitBasicInfoStep from "./PhishingKitBasicInfoStep";
import PhishingKitEmailTemplatePicker from "./PhishingKitEmailTemplatePicker";
import PhishingKitLandingPagePicker from "./PhishingKitLandingPagePicker";
import PhishingKitSendingProfilePicker from "./PhishingKitSendingProfilePicker";
import {
  createPhishingKit,
  updatePhishingKit
} from "@/services/phishingKitsApi";
import type { PhishingKitCreate } from "@/types/phishingKit";
import {
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCircle2,
  File,
  FileCheck,
  Mail,
  MailCheck,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface PhishingKitFormProps {
  readonly editId?: number;
  readonly initialData?: {
    readonly name: string;
    readonly description: string;
    readonly args: Record<string, string>;
    readonly email_template_id: string | null;
    readonly email_template_name: string | null;
    readonly landing_page_template_id: string | null;
    readonly landing_page_template_name: string | null;
    sending_profile_ids: number[];
  };
}

export default function PhishingKitForm({
  editId,
  initialData
}: PhishingKitFormProps) {
  return (
    <PhishingKitProvider initialData={initialData}>
      <PhishingKitFormInner editId={editId} />
    </PhishingKitProvider>
  );
}

function PhishingKitFormInner({ editId }: { readonly editId?: number }) {
  const navigate = useNavigate();
  const { data, getValidationErrors, isValid } = usePhishingKit();
  const [isCompleted, setIsCompleted] = useState(false);
  const stepIcons = [BookOpen, Mail, File, Send] as const;
  const stepCompletedIcons = [
    BookOpenCheck,
    MailCheck,
    FileCheck,
    Check
  ] as const;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!data.name.trim()) {
          toast.error("Please provide a phishing kit name.");
          return false;
        }
        return true;
      case 2:
        if (!data.email_template_id) {
          toast.error("Please select an email template.");
          return false;
        }
        return true;
      case 3:
        if (!data.landing_page_template_id) {
          toast.error("Please select a landing page template.");
          return false;
        }
        return true;
      case 4:
        if (data.sending_profile_ids.length === 0) {
          toast.error("Please select at least one sending profile.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async (): Promise<boolean> => {
    if (!isValid()) {
      toast.error(getValidationErrors().join(" "));
      return false;
    }

    const payload: PhishingKitCreate = {
      name: data.name,
      description: data.description || undefined,
      args: data.args,
      email_template_id: data.email_template_id!,
      email_template_name: data.email_template_name!,
      landing_page_template_id: data.landing_page_template_id!,
      landing_page_template_name: data.landing_page_template_name!,
      sending_profile_ids: data.sending_profile_ids
    };

    try {
      if (editId) {
        await updatePhishingKit(editId, payload);
      } else {
        await createPhishingKit(payload);
      }
      setIsCompleted(true);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save phishing kit";
      toast.error(message);
      return false;
    }
  };

  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Phishing Kit {editId ? "Updated" : "Created"}!
        </h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          Your phishing kit "<span className="font-medium">{data.name}</span>"
          has been {editId ? "updated" : "created"} successfully.
        </p>
        <button
          onClick={() => navigate({ to: "/phishing-kits" })}
          className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-medium text-primary-foreground bg-primary transition-all duration-150 hover:scale-[1.02] hover:bg-primary/90"
        >
          Back to Phishing Kits
        </button>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col p-6">
      <div className="flex-1 min-h-0 ">
        <Stepper
          stepIcons={stepIcons}
          stepCompletedIcons={stepCompletedIcons}
          validateStep={validateStep}
          onBeforeComplete={handleComplete}
          onFinalStepCompleted={() => {}}
          nextButtonText="Continue"
          backButtonText="Back"
        >
          <Step>
            <PhishingKitBasicInfoStep />
          </Step>
          <Step>
            <PhishingKitEmailTemplatePicker />
          </Step>
          <Step>
            <PhishingKitLandingPagePicker />
          </Step>
          <Step>
            <PhishingKitSendingProfilePicker />
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
