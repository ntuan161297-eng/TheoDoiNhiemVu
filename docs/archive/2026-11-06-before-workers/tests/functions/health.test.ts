import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest as health } from '../../functions/api/health';
import { onRequest as middleware } from '../../functions/api/_middleware';

const context = (path = '/api/health', method = 'GET') => ({
  request: new Request(`https://local.invalid${path}`, { method }),
  env: { APP_ENV: 'development' }, data: { requestId: 'unit-request' },
  next: vi.fn(), params: {},
}) as unknown as Parameters<typeof middleware>[0];

afterEach(() => vi.restoreAllMocks());
describe('Pages Functions infrastructure boundary', () => {
  it('exposes health and explicitly reports that DB/Auth/storage are not enabled', async () => {
    const ctx = context();
    const result = await health(ctx);
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ ok: true, data: { stage: 'A', mode: 'ui-mock', environment: 'development',
      dependencies: { database: 'not-enabled', storage: 'not-enabled', authentication: 'not-enabled' } } });
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });

  it('rejects writes to health', async () => {
    const result = await health(context('/api/health', 'POST'));
    expect(result.status).toBe(405);
    expect(result.headers.get('Allow')).toBe('GET, HEAD');
  });

  it('keeps tenant/business endpoints closed even with unverified authorization headers', async () => {
    const ctx = context('/api/tasks');
    ctx.request.headers.set('Authorization', 'Bearer not-verified');
    ctx.next = vi.fn().mockResolvedValue(new Response('should not execute'));
    const result = await middleware(ctx);
    expect(result.status).toBe(404);
    expect(await result.json()).toMatchObject({ ok: false, error: { code: 'API_NOT_FOUND' } });
    expect(ctx.next).not.toHaveBeenCalled();
  });

  it('generates correlation IDs instead of trusting client-provided IDs', async () => {
    const ctx = context(); ctx.request.headers.set('X-Request-Id', 'untrusted');
    ctx.next = async () => health(ctx);
    const result = await middleware(ctx);
    const body = await result.json() as { requestId: string };
    expect(body.requestId).toMatch(/^[a-f0-9-]{36}$/);
    expect(result.headers.get('X-Request-Id')).toBe(body.requestId);
  });

  it('does not disclose exception messages or a stack to the browser', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ctx = context(); ctx.next = async () => { throw new Error('sensitive internal detail'); };
    const result = await middleware(ctx);
    expect(result.status).toBe(500);
    expect(await result.text()).not.toContain('sensitive internal detail');
  });

  it('returns a bodyless HEAD response with the same no-store headers', async () => {
    const ctx = context('/api/health', 'HEAD'); ctx.next = async () => health(ctx);
    const result = await middleware(ctx);
    expect(result.status).toBe(200);
    expect(await result.text()).toBe('');
    expect(result.headers.get('Cache-Control')).toBe('no-store');
  });
});
