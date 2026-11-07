import { expect, test } from '@playwright/test';

const healthBody = { status: 'ok', service: 'theo-doi-nhiem-vu-api' };

test('Worker serves JSON for API fetches and navigation requests, never the SPA fallback', async ({ page, request }) => {
  await page.goto('/tong-quan');
  const health = await page.evaluate(async () => {
    const response = await fetch('/api/health');
    return { status: response.status, body: await response.json(), contentType: response.headers.get('Content-Type') };
  });
  expect(health).toEqual({ status: 200, body: healthBody, contentType: 'application/json; charset=utf-8' });

  for (const headers of [{}, { 'Sec-Fetch-Mode': 'navigate', Accept: 'text/html' }]) {
    const response = await request.get('/api/health', { headers });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['content-type']).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual(healthBody);
    for (const path of ['/api', '/api/', '/api/khong-ton-tai', '/api/tasks', '/api/health/missing']) {
      const missing = await request.get(path, { headers: { ...headers, Authorization: 'Bearer unverified-fixture' } });
      expect(missing.status(), path).toBe(404);
      expect(missing.headers()['content-type']).toBe('application/json; charset=utf-8');
      expect(await missing.json()).toMatchObject({ ok: false, error: { code: 'API_NOT_FOUND' } });
    }
  }
  // page.goto generates a real browser navigation, not just an emulated header.
  for (const [path, status] of [['/api/health', 200], ['/api/khong-ton-tai', 404]] as const) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    expect(response?.headers()['content-type']).toBe('application/json; charset=utf-8');
    expect(await response?.json()).toMatchObject(status === 200 ? healthBody : { ok: false });
  }
  const head = await request.head('/api/health');
  expect(head.status()).toBe(200);
  expect(await head.text()).toBe('');
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await request.fetch('/api/health', { method });
    expect(response.status()).toBe(405);
    expect(response.headers()['allow']).toBe('GET, HEAD');
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } });
  }
});

test('Worker Static Assets serves every direct UI route and JS/CSS without a Worker API response', async ({ page, request }) => {
  for (const route of ['/tong-quan', '/nhiem-vu', '/can-don-doc', '/bao-cao', '/danh-muc', '/dang-nhap']) {
    const response = await page.goto(`${route}?source=HDND`);
    expect(response?.status(), route).toBe(200);
    await expect(page.getByRole('button', { name: 'Vào giao diện DEMO' })).toBeVisible();
    expect((await page.reload())?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Vào giao diện DEMO' })).toBeVisible();
  }
  const html = await (await request.get('/')).text();
  const script = html.match(/src="([^\"]+\.js)"/)![1];
  const css = html.match(/href="([^\"]+\.css)"/)![1];
  for (const [path, type] of [[script, /javascript/], [css, /text\/css/], ['/favicon.svg', /image\/svg/], ['/assets/huong-do-countryside.png', /image\/png/]] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type']).toMatch(type);
    expect(response.headers()['x-request-id']).toBeUndefined();
  }
});
