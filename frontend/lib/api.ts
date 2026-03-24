const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type UserRole = 'student' | 'warden' | 'admin';

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export function getRole(): UserRole | '' {
  if (typeof window === 'undefined') return '';
  return (localStorage.getItem('role') as UserRole) || '';
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || 'API request failed');
  }

  return res.json();
}

export function decodeRoleFromJWT(token: string): UserRole | '' {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role as UserRole;
  } catch {
    return '';
  }
}

export function getWsUrl() {
  const base = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/updates';
  return base;
}

export function extractApiError(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong';
  try {
    const parsed = JSON.parse(error.message);
    if (typeof parsed?.detail === 'string') return parsed.detail;
  } catch {
    // not JSON payload
  }
  return error.message;
}
