import { createContext, useContext, useState, type ReactNode } from "react";

export interface CampaignData {
  // Basic Info (from CampaignForms)
  name: string;
  description: string;

  // Templates (placeholders for now)
  email_template_id: number | null;
  landing_page_template_id: number | null;
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
  email_template_id: number;
  landing_page_template_id: number;
  user_group_ids: string[];
}

interface CampaignContextType {
  data: CampaignData;
  updateData: (updates: Partial<CampaignData>) => void;
  resetData: () => void;
  isValid: () => boolean;
  getPayload: () => CampaignCreatePayload | null;
  creatorId?: string;
}

const initialCampaignData: CampaignData = {
  name: "",
  description: "",
  email_template_id: null,
  landing_page_template_id: null,
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

  const isValid = (): boolean => {
    console.log(data);
    return (
      data.name.trim() !== "" &&
      data.email_template_id !== null &&
      data.landing_page_template_id !== null &&
      data.sending_profile_id !== null &&
      data.user_group_ids.length > 0 &&
      data.begin_date !== null &&
      data.end_date !== null
    );
  };

  const getPayload = (): CampaignCreatePayload | null => {
    if (!isValid()) return null;

    return {
      name: data.name,
      description: data.description || null,
      begin_date: data.begin_date!,
      end_date: data.end_date!,
      sending_interval_seconds: data.sending_interval_seconds,
      sending_profile_id: data.sending_profile_id!,
      email_template_id: data.email_template_id!,
      landing_page_template_id: data.landing_page_template_id!,
      user_group_ids: data.user_group_ids,
    };
  };

  return (
    <CampaignContext.Provider
      value={{ data, updateData, resetData, isValid, getPayload, creatorId }}
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
