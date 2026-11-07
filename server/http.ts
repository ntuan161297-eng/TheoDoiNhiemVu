import type { ApiFailure, ApiSuccess } from '../shared/api';

export function json(payload: unknown, requestId: string, status = 200, headers?: HeadersInit): Response {
  const resultHeaders = new Headers(headers);
  resultHeaders.set('Content-Type', 'application/json; charset=utf-8');
  resultHeaders.set('Cache-Control', 'no-store');
  resultHeaders.set('X-Content-Type-Options', 'nosniff');
  resultHeaders.set('X-Request-Id', requestId);
  return new Response(JSON.stringify(payload), { status, headers: resultHeaders });
}

export function success<T>(data: T, requestId: string): Response {
  const payload: ApiSuccess<T> = { ok: true, data, requestId };
  return json(payload, requestId, 200);
}

export function failure(status: number, code: string, message: string, requestId: string, headers?: HeadersInit): Response {
  const payload: ApiFailure = { ok: false, error: { code, message }, requestId };
  return json(payload, requestId, status, headers);
}
