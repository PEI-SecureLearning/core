import { apiClient } from "@/lib/api-client";
import type { PhishingKitDisplayInfo, PhishingKitCreate } from "@/types/phishingKit";

export async function fetchPhishingKits(): Promise<PhishingKitDisplayInfo[]> {
  return apiClient.get<PhishingKitDisplayInfo[]>("/phishing-kits");
}

export async function fetchPhishingKit(id: number): Promise<PhishingKitDisplayInfo> {
  return apiClient.get<PhishingKitDisplayInfo>(`/phishing-kits/${id}`);
}

export async function createPhishingKit(data: PhishingKitCreate): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/phishing-kits", data);
}

export async function updatePhishingKit(id: number, data: PhishingKitCreate): Promise<{ message: string }> {
  return apiClient.put<{ message: string }>(`/phishing-kits/${id}`, data);
}

export async function deletePhishingKit(id: number): Promise<void> {
  return apiClient.delete(`/phishing-kits/${id}`) as Promise<void>;
}
