import { type ButtonHTMLAttributes, type ComponentType } from "react";
import {
    BookOpen,
    BookOpenCheck,
    Calendar,
    CalendarCheck2,
    Mail,
    MailCheck,
    Package,
    PackageCheck,
    UserRound,
    UserRoundCheck
} from "lucide-react";
import { toast } from "sonner";

import Stepper, { Step } from "@/components/ui/Stepper";
import CampaignForms from "@/components/campaigns/new-campaign/CampaignForms";
import TargetGroupSelector from "@/components/campaigns/new-campaign/TargetGroupSelector";
import PhishingKitPicker from "@/components/campaigns/new-campaign/PhishingKitPicker";
import SendingProfilePicker from "@/components/campaigns/new-campaign/SendingProfilePicker";
import CampaignScheduler from "@/components/campaigns/new-campaign/CampaignScheduler";
import {
    type CampaignCreatePayload,
    useCampaign
} from "@/components/campaigns/new-campaign/CampaignContext";

interface StepConfig {
    name: string;
    component: ComponentType<unknown>;
}

interface CampaignStepperFlowProps {
    readonly onSubmitPayload: (
        payload: CampaignCreatePayload
    ) => Promise<boolean> | boolean;
    readonly onStepChange?: (step: number) => void;
    readonly nextButtonText?: string;
    readonly backButtonText?: string;
    readonly isSubmitting?: boolean;
    readonly backButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
    readonly nextButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
}

export default function CampaignStepperFlow({
    onSubmitPayload,
    onStepChange,
    nextButtonText = "Next",
    backButtonText = "Previous",
    isSubmitting = false,
    backButtonProps,
    nextButtonProps
}: CampaignStepperFlowProps) {
    const { data, getPayload, isValid, getValidationErrors } = useCampaign();

    const steps: StepConfig[] = [
        { name: "forms", component: CampaignForms },
        { name: "target-groups", component: TargetGroupSelector },
        { name: "phishing-kits", component: PhishingKitPicker },
        { name: "sending-profiles", component: SendingProfilePicker },
        { name: "schedule", component: CampaignScheduler }
    ];

    const stepIcons = [BookOpen, UserRound, Package, Mail, Calendar] as const;
    const stepCompletedIcons = [
        BookOpenCheck,
        UserRoundCheck,
        PackageCheck,
        MailCheck,
        CalendarCheck2
    ] as const;
    const sendingProfilesStepIndex =
        steps.findIndex((step) => step.name === "sending-profiles") + 1;
    const stepWarnings =
        data.sending_profile_ids.length === 0 && sendingProfilesStepIndex > 0
            ? [sendingProfilesStepIndex]
            : [];

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!data.name.trim()) {
                    toast.error("Campaign name is required.");
                    return false;
                }
                return true;
            case 2:
                if (data.user_group_ids.length === 0) {
                    toast.error("Please select at least one target group.");
                    return false;
                }
                return true;
            case 3:
                if (data.phishing_kit_ids.length === 0) {
                    toast.error("Please select at least one phishing kit.");
                    return false;
                }
                return true;
            case 4:
            default:
                return true;
        }
    };

    const handleBeforeComplete = async (): Promise<boolean> => {
        if (!isValid()) {
            const errors = getValidationErrors();
            toast.error(
                errors.length
                    ? errors.join(" ")
                    : "Campaign data is incomplete. Please fill in all required fields."
            );
            return false;
        }

        const payload = getPayload();
        if (!payload) {
            toast.error("Failed to prepare campaign payload.");
            return false;
        }

        return onSubmitPayload(payload);
    };

    return (
        <Stepper
            initialStep={1}
            onStepChange={onStepChange}
            onBeforeComplete={handleBeforeComplete}
            validateStep={validateStep}
            backButtonText={backButtonText}
            nextButtonText={nextButtonText}
            stepIcons={stepIcons}
            stepCompletedIcons={stepCompletedIcons}
            stepWarnings={stepWarnings}
            backButtonProps={{ ...backButtonProps, disabled: isSubmitting }}
            nextButtonProps={{ ...nextButtonProps, disabled: isSubmitting }}
        >
            {steps.map((stepConfig) => (
                <Step key={stepConfig.name}>
                    <stepConfig.component />
                </Step>
            ))}
        </Stepper>
    );
}
