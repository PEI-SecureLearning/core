import keycloak from '../keycloak';

export class HttpError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };

    if (keycloak.authenticated && keycloak.token) {
      headers.Authorization = `Bearer ${keycloak.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = undefined;
      }
      throw new HttpError(
        response.status,
        `${init.method || 'GET'} ${endpoint} failed: ${response.statusText}`,
        data
      );
    }

    if (response.status === 204) {
      return undefined as any;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T | void> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL);
