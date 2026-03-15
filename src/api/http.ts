const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string;
const BASE_URL = rawBaseUrl?.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const USE_CREDENTIALS = import.meta.env.VITE_API_USE_CREDENTIALS === 'true';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function hasAuthorizationHeader(headers: HeadersInit | undefined): boolean {
  if (!headers) {
    return false;
  }
  if (headers instanceof Headers) {
    return headers.has('Authorization');
  }
  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === 'authorization');
  }
  return Object.keys(headers).some((key) => key.toLowerCase() === 'authorization');
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set');
  }
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken && !hasAuthorizationHeader(options.headers)) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: options.credentials ?? (USE_CREDENTIALS ? 'include' : 'omit')
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
