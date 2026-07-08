/** Minimal browser fetch wrapper for the JSON API envelope (client components). */

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
  });
  const json = (await res.json().catch(() => null)) as {
    data?: T;
    error?: { message?: string };
  } | null;
  if (!res.ok) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json?.data as T;
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
