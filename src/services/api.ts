import type { ApiResult, HealthInfo } from '../../shared/api';

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly requestId?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body' | 'headers' | 'credentials' | 'mode' | 'redirect'> {
  json?: unknown;
  headers?: HeadersInit;
  // Tokens come from the identity SDK in Stage B, never from a DEMO role.
  accessToken?: string;
  tenantId?: string;
}

function apiPath(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('#')) {
    throw new TypeError('Đường dẫn API phải là đường dẫn tương đối trong /api.');
  }
  const url = new URL(`/api${path}`, 'https://same-origin.invalid');
  if (!url.pathname.startsWith('/api/')) throw new TypeError('Không được gọi ra ngoài /api.');
  return url.pathname + url.search;
}

// Prepared but deliberately NOT connected to DemoProvider or login in Stage A.
async function requestJson(path: string, options: ApiOptions): Promise<{ response: Response; payload: unknown }> {
  const url = apiPath(path);
  const { json, accessToken, tenantId, headers: inputHeaders, ...requestOptions } = options;
  const headers = new Headers(inputHeaders);
  headers.set('Accept', 'application/json');
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (tenantId) headers.set('X-Tenant-Id', tenantId);
  const response = await fetch(url, {
    ...requestOptions, headers,
    body: json === undefined ? undefined : JSON.stringify(json),
    credentials: 'same-origin', mode: 'same-origin', redirect: 'error', cache: 'no-store',
  });
  if (response.status === 204 && response.ok) return { response, payload: undefined };
  let payload: unknown;
  try {
    if (!response.headers.get('Content-Type')?.toLowerCase().includes('application/json')) throw new Error('Unexpected response format');
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, 'INVALID_API_RESPONSE', 'Máy chủ chưa trả dữ liệu API hợp lệ.', response.headers.get('X-Request-Id') ?? undefined);
  }
  return { response, payload };
}

// Business endpoints will use this envelope after authorization is implemented.
export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { response, payload: body } = await requestJson(path, options);
  if (response.status === 204 && response.ok) return undefined as T;
  const payload = body as ApiResult<T> | null;
  if (!payload || typeof payload.ok !== 'boolean' || typeof payload.requestId !== 'string'
    || (payload.ok && !('data' in payload))
    || (!payload.ok && (typeof payload.error?.code !== 'string' || typeof payload.error?.message !== 'string'))) {
    throw new ApiError(response.status, 'INVALID_API_RESPONSE', 'Máy chủ chưa trả dữ liệu API hợp lệ.', response.headers.get('X-Request-Id') ?? undefined);
  }
  if (!payload.ok) throw new ApiError(response.status, payload.error.code, payload.error.message, payload.requestId);
  if (!response.ok) throw new ApiError(response.status, 'HTTP_ERROR', 'Không thể thực hiện yêu cầu API.', payload.requestId);
  return payload.data;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthInfo> {
  const { response, payload } = await requestJson('/health', { signal });
  if (!response.ok) throw new ApiError(response.status, 'HTTP_ERROR', 'Không thể kiểm tra API.', response.headers.get('X-Request-Id') ?? undefined);
  const health = payload as Partial<HealthInfo> | null;
  if (health?.status !== 'ok' || health.service !== 'theo-doi-nhiem-vu-api') {
    throw new ApiError(response.status, 'INVALID_API_RESPONSE', 'Phản hồi health không hợp lệ.');
  }
  return health as HealthInfo;
}
