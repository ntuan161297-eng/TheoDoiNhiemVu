import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('Pages/workerd: frontend and API share origin; API misses stay JSON and do not fall back to SPA', async ({ page, request }) => {
  await page.goto('/tong-quan');
  await expect(page.getByRole('button', { name: 'Vào giao diện DEMO' })).toBeVisible();
  const health = await page.evaluate(async () => {
    const response = await fetch('/api/health', { credentials: 'same-origin' });
    return { status: response.status, body: await response.json(), id: response.headers.get('X-Request-Id') };
  });
  expect(health.status).toBe(200);
  expect(health.body).toMatchObject({ ok: true, data: { stage: 'A', mode: 'ui-mock', environment: 'development' } });
  expect(health.body.requestId).toBe(health.id);
  const head = await request.head('/api/health');
  expect(head.status()).toBe(200); expect(await head.text()).toBe('');
  const post = await request.post('/api/health', { data: {} });
  expect(post.status()).toBe(405); expect(post.headers()['allow']).toBe('GET, HEAD');
  for (const path of ['/api', '/api/tasks', '/api/tenants', '/api/no-such-route']) {
    const response = await request.get(path, { headers: { Authorization: 'Bearer unverified-fixture' } });
    expect(response.status(), path).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect(await response.json()).toMatchObject({ ok: false, error: { code: 'API_NOT_FOUND' } });
  }
});

test('Pages SPA refresh works for every UI route; static assets bypass Functions', async ({ page, request }) => {
  for (const route of ['/tong-quan','/nhiem-vu','/can-don-doc','/bao-cao','/danh-muc','/dang-nhap']) {
    const response = await page.goto(`${route}?source=HDND`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Vào giao diện DEMO' })).toBeVisible();
    expect((await page.reload())?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Vào giao diện DEMO' })).toBeVisible();
  }
  const html = await (await request.get('/')).text();
  const script = html.match(/src="([^\"]+\.js)"/)![1];
  for (const path of [script,'/favicon.svg','/assets/huong-do-countryside.png']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-request-id']).toBeUndefined();
  }
  const routes = JSON.parse(await readFile('dist/_routes.json','utf8'));
  expect(routes.include).toEqual(['/api','/api/*']);
  expect(routes.exclude).toEqual([]);
});
