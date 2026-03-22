import { apiClient } from "@/lib/api-client";
import type { Template } from "@/components/templates/types";

export const templateApi = {
  getTemplates: () => apiClient.get<Template[]>("/templates"),
  
  getTemplate: (id: string) => apiClient.get<Template>(`/templates/${id}`),
  
  createTemplate: (data: Omit<Template, "id" | "created_at" | "updated_at" | "org_id">) => 
    apiClient.post<Template>("/templates", data),
    
  updateTemplate: (id: string, data: Partial<Template>) => 
    apiClient.put<Template>(`/templates/${id}`, data),
    
  deleteTemplate: (id: string) => 
    apiClient.delete(`/templates/${id}`) as Promise<void>,
};
