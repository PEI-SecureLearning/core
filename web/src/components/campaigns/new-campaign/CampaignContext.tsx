import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

export interface CampaignData {
  // Basic Info (from CampaignForms)
  name: string;
  description: string;

  // Templates and Profiles
  phishing_kit_ids: number[];
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
  phishing_kit_ids: number[];
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
    end_date: endDate.toISOString()
  };
}

const getInitialCampaignData = (
  initialGroupIds: string[] = [],
  initialData?: Partial<CampaignData>
): CampaignData => {
  const { begin_date, end_date } = getDefaultDates();

  const createDefaults: CampaignData = {
    name: "",
    description: "",
    phishing_kit_ids: [],
    sending_profile_ids: [],
    user_group_ids: initialGroupIds,
    begin_date,
    end_date,
    sending_interval_seconds: 60 // default 1 minute
  };

  return {
    ...createDefaults,
    ...initialData,
    name: initialData?.name ?? createDefaults.name,
    description: initialData?.description ?? createDefaults.description,
    phishing_kit_ids:
      initialData?.phishing_kit_ids ?? createDefaults.phishing_kit_ids,
    sending_profile_ids:
      initialData?.sending_profile_ids ?? createDefaults.sending_profile_ids,
    user_group_ids: initialData?.user_group_ids ?? createDefaults.user_group_ids,
    begin_date: initialData?.begin_date ?? createDefaults.begin_date,
    end_date: initialData?.end_date ?? createDefaults.end_date,
    sending_interval_seconds:
      initialData?.sending_interval_seconds ??
      createDefaults.sending_interval_seconds
  };
};

const CampaignContext = createContext<CampaignContextType | undefined>(
  undefined,
);

export function CampaignProvider({
  children,
  initialGroupIds,
  initialData
}: {
  readonly children: ReactNode;
  readonly initialGroupIds?: string[];
  readonly initialData?: Partial<CampaignData>;
}) {
  const [data, setData] = useState<CampaignData>(
    getInitialCampaignData(initialGroupIds, initialData)
  );

  const updateData = useCallback((updates: Partial<CampaignData>) => {
    setData((prev) => {
      const next = { ...prev, ...updates };
      const hasChanges = (Object.keys(updates) as Array<keyof CampaignData>).some(
        (key) => prev[key] !== next[key]
      );
      return hasChanges ? next : prev;
    });
  }, []);

  const resetData = useCallback(() => {
    setData(getInitialCampaignData(initialGroupIds, initialData));
  }, [initialData, initialGroupIds]);

  const getValidationErrors = useCallback((): string[] => {
    const errors: string[] = [];

    if (!data.name.trim()) errors.push("Campaign name is required.");
    if (data.phishing_kit_ids.length === 0)
      errors.push("Select at least one phishing kit.");
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
  }, [data]);

  const isValid = useCallback((): boolean => getValidationErrors().length === 0, [
    getValidationErrors
  ]);

  const getPayload = useCallback((): CampaignCreatePayload | null => {
    if (!isValid()) return null;

    return {
      name: data.name,
      description: data.description || null,
      begin_date: data.begin_date!,
      end_date: data.end_date!,
      sending_interval_seconds: data.sending_interval_seconds,
      sending_profile_ids: data.sending_profile_ids,
      phishing_kit_ids: data.phishing_kit_ids,
      user_group_ids: data.user_group_ids
    };
  }, [data, isValid]);

  const contextValue = useMemo(
    () => ({
      data,
      updateData,
      resetData,
      getValidationErrors,
      isValid,
      getPayload
    }),
    [data, getPayload, getValidationErrors, isValid, resetData, updateData]
  );

  return (
    <CampaignContext.Provider value={contextValue}>
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
