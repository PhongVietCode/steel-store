import { v4 as uuidv4 } from 'uuid';
import { clearToken, loadToken } from './auth-storage';

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail | null;

  constructor(status: number, problem: ProblemDetail | null, message: string) {
    super(message);
    this.status = status;
    this.problem = problem;
  }
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [extra: string]: unknown;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Override the auto-injected idempotency key (POST /api/bills/*). */
  idempotencyKey?: string;
}

// In dev, the Vite proxy forwards /api to localhost:8080. In prod, set
// VITE_API_BASE_URL to the backend's absolute origin+path (e.g.
// https://steel-store-api.onrender.com/api) so the SPA can call the
// backend directly without any host-side proxy/_redirects rewrite.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/**
 * Single entry point for backend calls.
 *  - Adds JWT from localStorage (if present).
 *  - Auto-generates an Idempotency-Key (UUID v4) for POST /api/bills/*.
 *  - On 401 -> clears token + redirects to /login.
 *  - On non-2xx -> throws ApiError with the parsed ProblemDetail body.
 */
export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query, idempotencyKey } = opts;

  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = loadToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  if (method === 'POST' && path.startsWith('/bills')) {
    headers['Idempotency-Key'] = idempotencyKey ?? uuidv4();
  }

  const sameOrigin = url.origin === window.location.origin;
  const requestUrl = sameOrigin ? url.pathname + url.search : url.toString();

  const res = await fetch(requestUrl, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'omit',
  });

  if (res.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
    throw new ApiError(401, null, 'Not authenticated');
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    const pd = (parsed && typeof parsed === 'object' ? (parsed as ProblemDetail) : null);
    throw new ApiError(res.status, pd, pd?.detail ?? `HTTP ${res.status}`);
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
