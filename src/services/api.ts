/** Shared API client. Access tokens stay in memory; refresh tokens are httpOnly cookies. */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }
export async function refreshAccessToken() { return refreshToken(); }

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST', credentials: 'include', headers: { 'X-Nexto-CSRF': '1' },
      });
      if (!response.ok) { accessToken = null; return null; }
      const body = await response.json() as ApiEnvelope<{ accessToken?: string }>;
      accessToken = body.data?.accessToken ?? null;
      return accessToken;
    } catch { accessToken = null; return null; }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { message?: string; code?: string; details?: unknown };
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipRefresh?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipRefresh = false, headers: providedHeaders, ...init } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = new Headers(providedHeaders);
  headers.set('Accept', 'application/json');
  if (body !== undefined && !isFormData) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: isFormData ? (body as BodyInit) : JSON.stringify(body) } : {}),
  };
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  let response = await fetch(url, requestInit);
  const isAuthEndpoint = /\/auth\/(login|register|refresh|logout|logout-all)/.test(path);
  if (response.status === 401 && !skipRefresh && !isAuthEndpoint && await refreshToken()) {
    const retryHeaders = new Headers(headers);
    if (accessToken) retryHeaders.set('Authorization', `Bearer ${accessToken}`);
    response = await fetch(url, { ...requestInit, headers: retryHeaders });
  }
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok) {
    const errorPayload = payload as (ApiEnvelope<T> & { message?: string; code?: string; details?: unknown }) | null;
    throw new ApiError(
      errorPayload?.error?.message || errorPayload?.message || `Request failed (${response.status})`,
      response.status,
      errorPayload?.error?.code || errorPayload?.code,
      errorPayload?.error?.details,
    );
  }
  return (payload?.data ?? payload) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

export function getApiBaseUrl() { return API_BASE_URL; }
