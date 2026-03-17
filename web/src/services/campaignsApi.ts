const API_URL = import.meta.env.VITE_API_URL;

// --- Tipos alinhados com o campaign.py (Backend) ---

export type CampaignStatus = "scheduled" | "running" | "completed" | "canceled";

// Baseado no modelo CampaignDisplayInfo ou Campaign
export interface Campaign {
  id: number; // O backend manda int, não string!
  name: string;
  description?: string;
  begin_date: string; // Vem como string ISO do Python
  end_date: string; // Vem como string ISO do Python
  status: CampaignStatus;

  // Estatísticas "Flat" (sem o objeto 'stats' aninhado)
  total_recipients?: number;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  total_phished?: number;
}

export async function fetchCampaigns(_realm: string, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/campaigns`, { headers });

  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json() as Promise<Campaign[]>;
}

export async function fetchOrgManagerCampaigns(realm: string, token?: string) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(
    `${API_URL}/org-manager/${encodeURIComponent(realm)}/campaigns`,
    { headers },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch campaigns (${res.status})`);
  }

  const data = (await res.json()) as { campaigns?: Campaign[] } | Campaign[];
  return Array.isArray(data) ? data : (data.campaigns ?? []);
}
