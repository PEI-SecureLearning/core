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
  updatePhishingKit,
} from "@/services/phishingKitsApi";
import type { PhishingKitCreate } from "@/types/phishingKit";
import { CheckCircle2 } from "lucide-react";

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
  initialData,
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const stepLabels = [
    "Basic Info",
    "Email Template",
    "Landing Page",
    "Sending Profiles",
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!data.name.trim();
      case 2:
        return !!data.email_template_id;
      case 3:
        return !!data.landing_page_template_id;
      case 4:
        return data.sending_profile_ids.length > 0;
      default:
        return true;
    }
  };

  const handleComplete = async (): Promise<boolean> => {
    if (!isValid()) {
      setSubmitError(getValidationErrors().join(" "));
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
      sending_profile_ids: data.sending_profile_ids,
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
      setSubmitError(message);
      return false;
    }
  };

  if (isCompleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          Phishing Kit {editId ? "Updated" : "Created"}!
        </h2>
        <p className="text-slate-500 text-sm text-center max-w-md">
          Your phishing kit "<span className="font-medium">{data.name}</span>"
          has been {editId ? "updated" : "created"} successfully.
        </p>
        <button
          onClick={() => navigate({ to: "/phishing-kits" })}
          className="mt-4 px-5 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all duration-150 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)",
            boxShadow: "0 4px 14px rgba(147, 51, 234, 0.25)",
          }}
        >
          Back to Phishing Kits
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {submitError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {submitError}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Stepper
          stepLabels={stepLabels}
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
