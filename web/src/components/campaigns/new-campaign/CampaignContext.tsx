import { createContext, useContext, useState, type ReactNode } from "react";

export interface CampaignData {
  // Basic Info (from CampaignForms)
  name: string;
  description: string;

  // Templates (can be existing ids or inline selections)
  email_template_id: number | null;
  landing_page_template_id: number | null;
  email_template: TemplateSelection | null;
  landing_page_template: TemplateSelection | null;
  sending_profile_id: number | null;

  // Target Groups
  user_group_ids: string[];

  // Schedule
  begin_date: string | null; // ISO datetime string
  end_date: string | null; // ISO datetime string
  sending_interval_seconds: number;
}

export interface CampaignCreatePayload {
  name: string;
  description: string | null;
  begin_date: string;
  end_date: string;
  sending_interval_seconds: number;
  sending_profile_id: number;
  email_template_id: number | null;
  landing_page_template_id: number | null;
  email_template: TemplateSelection | null;
  landing_page_template: TemplateSelection | null;
  user_group_ids: string[];
}

export interface TemplateSelection {
  id: string;
  name?: string;
  subject?: string;
  path?: string;
}

interface CampaignContextType {
  data: CampaignData;
  updateData: (updates: Partial<CampaignData>) => void;
  resetData: () => void;
  getValidationErrors: () => string[];
  isValid: () => boolean;
  getPayload: () => CampaignCreatePayload | null;
  creatorId?: string;
}

const initialCampaignData: CampaignData = {
  name: "",
  description: "",
  email_template_id: null,
  landing_page_template_id: null,
  email_template: null,
  landing_page_template: null,
  sending_profile_id: null,
  user_group_ids: [],
  begin_date: null,
  end_date: null,
  sending_interval_seconds: 60, // default 1 minute
};

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export function CampaignProvider({
  children,
  creatorId,
}: {
  children: ReactNode;
  creatorId?: string;
}) {
  const [data, setData] = useState<CampaignData>({
    ...initialCampaignData,
  });

  const updateData = (updates: Partial<CampaignData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData({ ...initialCampaignData });
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    const hasEmailTemplate =
      data.email_template_id !== null || data.email_template !== null;
    const hasLandingTemplate =
      data.landing_page_template_id !== null ||
      data.landing_page_template !== null;

    if (!data.name.trim()) errors.push("Campaign name is required.");
    if (!hasEmailTemplate) errors.push("Select an email template.");
    if (!hasLandingTemplate) errors.push("Select a landing page template.");
    // sending_profile_id optional; backend can create placeholder if missing
    if (data.user_group_ids.length === 0)
      errors.push("Select at least one target group.");
    if (!data.begin_date) errors.push("Begin date/time is required.");
    if (!data.end_date) errors.push("End date/time is required.");

    if (data.begin_date && data.end_date) {
      const start = new Date(data.begin_date).getTime();
      const end = new Date(data.end_date).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
        errors.push("End date/time must be after the start date/time.");
      }
    }

    return errors;
  };

  const isValid = (): boolean => getValidationErrors().length === 0;

  const getPayload = (): CampaignCreatePayload | null => {
    if (!isValid()) return null;

    return {
      name: data.name,
      description: data.description || null,
      begin_date: data.begin_date!,
      end_date: data.end_date!,
      sending_interval_seconds: data.sending_interval_seconds,
      sending_profile_id: data.sending_profile_id!,
      email_template_id: data.email_template_id,
      landing_page_template_id: data.landing_page_template_id,
      email_template: data.email_template,
      landing_page_template: data.landing_page_template,
      user_group_ids: data.user_group_ids,
    };
  };

  return (
    <CampaignContext.Provider
      value={{
        data,
        updateData,
        resetData,
        getValidationErrors,
        isValid,
        getPayload,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}

export default CampaignContext;
