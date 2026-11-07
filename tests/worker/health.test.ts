import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../../worker';
import type { Env } from '../../server/env';

const assetFetch = vi.fn(async () => new Response('static asset'));
const env = { ASSETS: { fetch: assetFetch }, APP_ENV: 'development' } as unknown as Env;
const call = (path = '/api/health', method = 'GET', headers?: HeadersInit) =>
  worker.fetch(new Request(`https://local.invalid${path}`, { method, headers }), env);
afterEach(() => vi.restoreAllMocks());

describe('Workers Static Assets API boundary', () => {
  it('returns exactly the approved health contract without environment/secrets', async () => {
    const result = await call();
    expect(result.status).toBe(200);
    expect(result.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(result.headers.get('Cache-Control')).toBe('no-store');
    expect(await result.json()).toEqual({ status: 'ok', service: 'theo-doi-nhiem-vu-api' });
  });

  it('rejects unsupported health methods with 405 and Allow', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      const result = await call('/api/health', method);
      expect(result.status).toBe(405);
      expect(result.headers.get('Allow')).toBe('GET, HEAD');
    }
  });

  it('never sends missing API routes, even navigation requests or fake tokens, to SPA assets', async () => {
    const before = assetFetch.mock.calls.length;
    for (const path of ['/api', '/api/', '/api/khong-ton-tai', '/api/tasks', '/api/health/extra']) {
      const result = await call(path, 'GET', { 'Sec-Fetch-Mode': 'navigate', Authorization: 'Bearer unverified' });
      expect(result.status).toBe(404);
      expect(await result.json()).toMatchObject({ ok: false, error: { code: 'API_NOT_FOUND' } });
    }
    expect(assetFetch.mock.calls.length).toBe(before);
  });

  it('delegates UI and asset requests without treating /api-lookalike as an API', async () => {
    for (const path of ['/tong-quan', '/nhiem-vu', '/assets/app.js', '/api-lookalike']) {
      expect(await (await call(path)).text()).toBe('static asset');
    }
  });

  it('generates its own correlation ID instead of trusting the client', async () => {
    const result = await call('/api/no-such-route', 'GET', { 'X-Request-Id': 'untrusted' });
    const body = await result.json() as { requestId: string };
    expect(body.requestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(result.headers.get('X-Request-Id')).toBe(body.requestId);
  });

  it('does not expose error messages or stacks to the client', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(JSON, 'stringify').mockImplementationOnce(() => { throw new Error('sensitive internal detail'); });
    const result = await call();
    expect(result.status).toBe(500);
    expect(await result.text()).not.toContain('sensitive internal detail');
  });

  it('retains status and no-store headers but no body for every API HEAD', async () => {
    for (const [path, status] of [['/api/health', 200], ['/api/missing', 404]] as const) {
      const result = await call(path, 'HEAD');
      expect(result.status).toBe(status);
      expect(await result.text()).toBe('');
      expect(result.headers.get('Cache-Control')).toBe('no-store');
    }
  });
});
