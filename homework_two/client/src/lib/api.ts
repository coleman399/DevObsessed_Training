import { ApiError } from './types';
import { tokenStorage } from './auth';

interface ApiFetchInit extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
}

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { body, token, headers, ...rest } = init;
  const resolvedToken = token === undefined ? tokenStorage.get() : token;

  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (!finalHeaders.has('Accept')) {
    finalHeaders.set('Accept', 'application/json');
  }
  if (resolvedToken) {
    finalHeaders.set('Authorization', `Bearer ${resolvedToken}`);
  }

  const response = await fetch(path, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.startsWith('application/json')) {
    const json: unknown = await response.json().catch(() => null);
    throw new ApiError(response.status, json);
  }
  const text = await response.text().catch(() => '');
  throw new ApiError(response.status, { raw: text });
}
