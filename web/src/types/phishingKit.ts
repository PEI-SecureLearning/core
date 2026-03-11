export interface PhishingKitDisplayInfo {
  id: number;
  name: string;
  description?: string;
  args: Record<string, string>;
  email_template_name?: string;
  landing_page_template_name?: string;
  sending_profile_names: string[];
}

export interface PhishingKitCreate {
  name: string;
  description?: string;
  args: Record<string, string>;
  email_template_id: number;
  landing_page_template_id: number;
  sending_profile_ids: number[];
}
