import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, getHealth } from './api';

afterEach(() => vi.unstubAllGlobals());
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'test-request' },
});

describe('API service contract', () => {
  it('uses same-origin /api and reads the minimal health contract without a DEMO role', async () => {
    const health = { status: 'ok', service: 'theo-doi-nhiem-vu-api' };
    const fetcher = vi.fn().mockResolvedValue(response(health));
    vi.stubGlobal('fetch', fetcher);
    expect(await getHealth()).toEqual(health);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/health');
    expect(init).toMatchObject({ credentials: 'same-origin', mode: 'same-origin', redirect: 'error', cache: 'no-store' });
    expect(init.headers.get('Authorization')).toBeNull();
    expect(init.headers.get('X-Tenant-Id')).toBeNull();
  });

  it('preserves explicit bearer/tenant selection for future backend verification', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ ok: true, data: { id: 'example' }, requestId: 'test-request' }));
    vi.stubGlobal('fetch', fetcher);
    await apiRequest('/tasks', { method: 'POST', accessToken: 'fixture-token', tenantId: 'fixture-tenant', json: { title: 'Test' } });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/tasks');
    expect(init.headers.get('Authorization')).toBe('Bearer fixture-token');
    expect(init.headers.get('X-Tenant-Id')).toBe('fixture-tenant');
    expect(JSON.parse(init.body)).toEqual({ title: 'Test' });
  });

  it('rejects failed or malformed health responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ status: 'ok', service: 'other' })));
    await expect(getHealth()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ status: 'ok', service: 'theo-doi-nhiem-vu-api' }, 503)));
    await expect(getHealth()).rejects.toMatchObject({ status: 503, code: 'HTTP_ERROR' });
  });

  it('retains permission error code/status/request ID instead of falling back to mock data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ok: false, error: { code: 'FORBIDDEN', message: 'Không đủ quyền.' }, requestId: 'test-request' }, 403)));
    await expect(apiRequest('/tasks')).rejects.toMatchObject({ name: 'ApiError', status: 403, code: 'FORBIDDEN', requestId: 'test-request' });
  });

  it('detects an HTML SPA fallback or malformed API payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>SPA</html>', { headers: { 'Content-Type': 'text/html' } })));
    await expect(getHealth()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ok: true })));
    await expect(getHealth()).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects external or traversal paths before sending credentials', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    for (const path of ['https://external.invalid', '//external.invalid', '/../outside', '/%2e%2e/outside', '/bad\\path']) {
      await expect(apiRequest(path)).rejects.toBeInstanceOf(TypeError);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('propagates cancellation/network failure without fake success', async () => {
    const error = new DOMException('Cancelled', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(getHealth()).rejects.toBe(error);
  });
});
