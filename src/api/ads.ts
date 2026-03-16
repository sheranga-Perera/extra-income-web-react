const rawAdsBaseUrl = (import.meta.env.VITE_ADS_API_BASE_URL as string) || (import.meta.env.VITE_API_BASE_URL as string);
const ADS_BASE_URL = rawAdsBaseUrl?.endsWith('/') ? rawAdsBaseUrl.slice(0, -1) : rawAdsBaseUrl;

async function adsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!ADS_BASE_URL) {
    throw new Error('VITE_ADS_API_BASE_URL is not set');
  }
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(`${ADS_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'omit'
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const data = text ? JSON.parse(text) : null;
      if (data?.message) {
        message = data.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    const statusLabel = `${response.status} ${response.statusText}`.trim();
    throw new Error(message || statusLabel || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export interface ActiveAdResponse {
  id: string;
  companyName: string;
  adTitle: string;
  adDescription: string;
  adType: string;
  mediaUrl: string | null;
  mediaContent?: string | null;
  cta: string | null;
  viewsPerDay: number | null;
  minutesPerDay: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface AdRequestPayload {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  adTitle: string;
  adDescription: string;
  adType: string;
  adGoal?: string;
  mediaUrl?: string;
  mediaContent?: string;
  mediaNotes?: string;
  cta?: string;
  viewsPerDay?: number;
  minutesPerDay?: number;
  startDate?: string;
  endDate?: string;
}

export interface AdRequestResponse extends AdRequestPayload {
  id: string;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
}

export async function fetchActiveAds(): Promise<ActiveAdResponse[]> {
  return adsRequest('/ads/active');
}

export async function createAdRequest(payload: AdRequestPayload): Promise<AdRequestResponse> {
  return adsRequest('/ads/requests', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
