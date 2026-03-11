import { createContext, useContext, useState, type ReactNode } from "react";

export interface CampaignData {
  // Basic Info (from CampaignForms)
  name: string;
  description: string;

  // Templates (can be existing ids or inline selections)
  landing_page_template_id: number | null;
  landing_page_template: TemplateSelection | null;
  sending_profile_ids: number[];

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
  sending_profile_ids: number[];
  landing_page_template_id: number | null;
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
}

// Helper to generate default dates (start: now, end: now + 5 minutes)
function getDefaultDates() {
  const now = new Date();
  const startDate = now;
  const endDate = new Date(now.getTime() + 5 * 60 * 1000); // +5 minutes
  return {
    begin_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
  };
}

const getInitialCampaignData = (initialGroupIds: string[] = []): CampaignData => {
  const { begin_date, end_date } = getDefaultDates();
  return {
    name: "",
    description: "",
    landing_page_template_id: null,
    landing_page_template: null,
    sending_profile_ids: [],
    user_group_ids: initialGroupIds,
    begin_date,
    end_date,
    sending_interval_seconds: 60, // default 1 minute
  };
};

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined
);

export function CampaignProvider({
  children,
  initialGroupIds,
}: {
  children: ReactNode;
  initialGroupIds?: string[];
}) {
  const [data, setData] = useState<CampaignData>(
    getInitialCampaignData(initialGroupIds)
  );

  const updateData = (updates: Partial<CampaignData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(getInitialCampaignData(initialGroupIds));
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    const hasLandingTemplate =
      data.landing_page_template_id !== null ||
      data.landing_page_template !== null;

    if (!data.name.trim()) errors.push("Campaign name is required.");
    if (!hasLandingTemplate) errors.push("Select a landing page template.");
    // sending_profile_ids is optional; the user is warned in the UI if empty.
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
      sending_profile_ids: data.sending_profile_ids,
      landing_page_template_id: data.landing_page_template_id,
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
