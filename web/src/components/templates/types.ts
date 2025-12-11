export interface Template {
  id: string;
  name: string;
  path: string;
  subject: string;
  category?: string | null;
  description?: string | null;
  html: string;
  created_at: string;
  updated_at: string;
}

export const initialTemplateForm = {
  name: "",
  path: "/templates/emails/",
  subject: "",
  category: "",
  description: "",
  html: "",
};
