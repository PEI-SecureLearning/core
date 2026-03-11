import { createContext, useContext, useState, type ReactNode } from "react";

export interface PhishingKitData {
  name: string;
  description: string;
  args: Record<string, string>;
  email_template_id: number | null;
  email_template_name: string | null;
  landing_page_template_id: number | null;
  landing_page_template_name: string | null;
  sending_profile_ids: number[];
}

interface PhishingKitContextType {
  data: PhishingKitData;
  updateData: (updates: Partial<PhishingKitData>) => void;
  resetData: () => void;
  getValidationErrors: () => string[];
  isValid: () => boolean;
}

const getInitialData = (): PhishingKitData => ({
  name: "",
  description: "",
  args: {},
  email_template_id: null,
  email_template_name: null,
  landing_page_template_id: null,
  landing_page_template_name: null,
  sending_profile_ids: [],
});

const PhishingKitContext = createContext<PhishingKitContextType | undefined>(
  undefined
);

export function PhishingKitProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: Partial<PhishingKitData>;
}) {
  const [data, setData] = useState<PhishingKitData>({
    ...getInitialData(),
    ...initialData,
  });

  const updateData = (updates: Partial<PhishingKitData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const resetData = () => {
    setData(getInitialData());
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (!data.name.trim()) errors.push("Kit name is required.");
    if (!data.email_template_id) errors.push("Select an email template.");
    if (!data.landing_page_template_id) errors.push("Select a landing page template.");
    if (data.sending_profile_ids.length === 0) errors.push("Select at least one sending profile.");
    return errors;
  };

  const isValid = (): boolean => getValidationErrors().length === 0;

  return (
    <PhishingKitContext.Provider
      value={{ data, updateData, resetData, getValidationErrors, isValid }}
    >
      {children}
    </PhishingKitContext.Provider>
  );
}

export function usePhishingKit() {
  const context = useContext(PhishingKitContext);
  if (!context) {
    throw new Error("usePhishingKit must be used within a PhishingKitProvider");
  }
  return context;
}

export default PhishingKitContext;
