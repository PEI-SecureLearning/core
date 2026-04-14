const API_URL = import.meta.env.VITE_API_URL;

export type CampaignStatus = "scheduled" | "running" | "active" | "completed" | "canceled" | "expired" | "overdue";

export interface Campaign {
  id: number;
  name: string;
  description?: string | null;
  begin_date: string;
  end_date: string;
  status: CampaignStatus;
  total_recipients?: number;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  total_phished?: number;
}

export interface CampaignDetail extends Campaign {
  description?: string | null;
  sending_interval_seconds: number;
  realm_name?: string | null;
  user_group_ids: string[];
  phishing_kit_ids: number[];
  sending_profile_ids: number[];
  phishing_kit_names: string[];
  creator_id?: string | null;
  creator_email?: string | null;
  sending_profile_names: string[];
  total_recipients: number;
  total_failed: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  phish_rate: number;
  progress_percentage: number;
  time_elapsed_percentage: number;
  avg_time_to_open_seconds?: number | null;
  avg_time_to_click_seconds?: number | null;
  first_open_at?: string | null;
  last_open_at?: string | null;
  first_click_at?: string | null;
  last_click_at?: string | null;
}

export interface CampaignUserSending {
  user_id: string;
  email: string;
  status: string;
  sent_at?: string | null;
  opened_at?: string | null;
  clicked_at?: string | null;
  phished_at?: string | null;
  error_cause?: string | null;
}

export interface CampaignUpdatePayload {
  name: string;
  description?: string | null;
  begin_date: string;
  end_date: string;
  sending_interval_seconds: number;
  user_group_ids: string[];
  phishing_kit_ids: number[];
  sending_profile_ids: number[];
}

interface CampaignDetailResponse {
  campaign?: CampaignDetail;
}

interface CampaignSendingsResponse {
  sendings?: CampaignUserSending[];
}

function isCampaignDetail(payload: unknown): payload is CampaignDetail {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "name" in payload &&
    "begin_date" in payload &&
    "end_date" in payload &&
    "status" in payload &&
    "sending_interval_seconds" in payload &&
    "user_group_ids" in payload &&
    "phishing_kit_ids" in payload &&
    "sending_profile_ids" in payload
  );
}

function extractCampaignDetail(
  payload: CampaignDetailResponse | CampaignDetail
): CampaignDetail | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "campaign" in payload
  ) {
    return isCampaignDetail(payload.campaign) ? payload.campaign : null;
  }

  return isCampaignDetail(payload) ? payload : null;
}

function buildHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseApiError(response: Response, fallbackMessage: string) {
  let message = fallbackMessage;

  try {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const payload = (await response.json()) as {
        detail?: string | Array<{ msg?: string }>;
        message?: string;
      };

      if (typeof payload.detail === "string") {
        message = payload.detail;
      } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
        message = payload.detail
          .map((entry) => entry.msg)
          .filter(
            (value): value is string =>
              typeof value === "string" && value.length > 0
          )
          .join(" ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
  } catch {
    // Keep fallback message when the error payload cannot be parsed.
  }

  return new Error(message);
}

export async function fetchCampaigns(_realm: string, token?: string) {
  const res = await fetch(`${API_URL}/campaigns`, {
    headers: buildHeaders(token)
  });

  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json() as Promise<Campaign[]>;
}

export async function fetchOrgManagerCampaigns(realm: string, token?: string) {
  const res = await fetch(
    `${API_URL}/org-manager/${encodeURIComponent(realm)}/campaigns`,
    { headers: buildHeaders(token) }
  );

  if (!res.ok) {
    throw await parseApiError(res, `Failed to fetch campaigns (${res.status})`);
  }

  const data = (await res.json()) as { campaigns?: Campaign[] } | Campaign[];
  return Array.isArray(data) ? data : (data.campaigns ?? []);
}

export async function fetchOrgManagerCampaignDetail(
  realm: string,
  campaignId: string | number,
  token?: string
): Promise<CampaignDetail> {
  const res = await fetch(
    `${API_URL}/org-manager/${encodeURIComponent(realm)}/campaigns/${campaignId}`,
    { headers: buildHeaders(token) }
  );

  if (!res.ok) {
    throw await parseApiError(res, `Failed to fetch campaign (${res.status})`);
  }

  const data = (await res.json()) as CampaignDetailResponse | CampaignDetail;
  const campaign = extractCampaignDetail(data);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  return campaign;
}

export async function updateOrgManagerCampaign(
  realm: string,
  campaignId: string | number,
  payload: CampaignUpdatePayload,
  token?: string
) {
  const res = await fetch(
    `${API_URL}/org-manager/${encodeURIComponent(realm)}/campaigns/${campaignId}`,
    {
      method: "PUT",
      headers: buildHeaders(token),
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    throw await parseApiError(res, `Failed to update campaign (${res.status})`);
  }

  return (await res.json()) as { message: string };
}

export async function fetchOrgManagerCampaignSendings(
  realm: string,
  campaignId: string | number,
  token?: string
): Promise<CampaignUserSending[]> {
  const res = await fetch(
    `${API_URL}/org-manager/${encodeURIComponent(realm)}/campaigns/${campaignId}/sendings`,
    { headers: buildHeaders(token) }
  );

  if (!res.ok) {
    throw await parseApiError(
      res,
      `Failed to fetch campaign sendings (${res.status})`
    );
  }

  const data = (await res.json()) as
    | CampaignSendingsResponse
    | CampaignUserSending[];
  return Array.isArray(data) ? data : (data.sendings ?? []);
}
