import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

function luminance(color: string) {
  const channels = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => {
    const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a: string, b: string) {
  const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

test('Design System: font tự lưu, cỡ chữ, tương phản AA và bố cục đăng nhập', async ({ page }) => {
  await mkdir('docs/qa/ui-upgrade', { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 14px "Be Vietnam Pro"', 'Theo dõi nhiệm vụ'))).toBe(true);
  await expect(page.locator('.login-form')).toHaveCSS('font-family', /Be Vietnam Pro/);
  const loginBounds = await page.locator('.login-form').boundingBox();
  expect(loginBounds!.y).toBeGreaterThanOrEqual(0);
  expect(loginBounds!.y + loginBounds!.height).toBeLessThanOrEqual(768);
  await page.getByRole('button', { name: 'Vào giao diện DEMO' }).click();
  await expect(page.locator('.page-heading h1')).toHaveCSS('font-size', '26px');
  await expect(page.locator('.page-heading h1')).toHaveCSS('font-weight', '700');
  await expect(page.locator('.kpi-label').first()).toHaveCSS('font-size', '15px');
  await expect(page.getByTestId('kpi-total').locator('strong')).toHaveCSS('font-weight', '800');
  await expect(page.locator('.panel-head h2').first()).toHaveCSS('font-size', '18px');

  const checks: { selector: string; foreground: string; background: string; ratio: number }[] = [];
  const primary = await page.locator('.heading-actions .ant-btn-primary').evaluate(el => ({ foreground: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
  const buttonRatio = contrast(primary.foreground, primary.background);
  checks.push({ selector: '.ant-btn-primary', ...primary, ratio: +buttonRatio.toFixed(2) });
  expect(buttonRatio, 'Chữ nút chính đạt AA').toBeGreaterThanOrEqual(4.5);
  for (const [selector, background] of [
    ['.page-heading h1', 'rgb(243,247,251)'], ['.filter-field label', 'rgb(255,255,255)'],
    ['.kpi-label', 'rgb(255,240,241)'], ['.kpi-hint', 'rgb(255,240,241)'],
    ['.task-name button', 'rgb(255,255,255)'], ['.task-code', 'rgb(255,255,255)'],
    ['.unit-link', 'rgb(255,255,255)'], ['.chart-footnote', 'rgb(255,255,255)'],
  ]) {
    const foreground = await page.locator(selector).first().evaluate(el => getComputedStyle(el).color);
    const ratio = contrast(foreground, background);
    checks.push({ selector, foreground, background, ratio: +ratio.toFixed(2) });
    expect(ratio, `${selector} đạt AA cho chữ thường`).toBeGreaterThanOrEqual(4.5);
  }
  await page.getByRole('navigation').getByRole('button', { name: 'Nhiệm vụ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý nhiệm vụ', exact: true })).toBeVisible();
  for (const tag of await page.locator('.status-tag').all()) {
    const pair = await tag.evaluate(el => ({ foreground: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
    if (pair.background === 'rgba(0, 0, 0, 0)') pair.background = 'rgb(255,255,255)';
    const ratio = contrast(pair.foreground, pair.background);
    checks.push({ selector: `.status-tag:${await tag.innerText()}`, ...pair, ratio: +ratio.toFixed(2) });
    expect(ratio, JSON.stringify(checks.at(-1))).toBeGreaterThanOrEqual(4.5);
  }
  await writeFile('docs/qa/ui-upgrade/contrast.json', JSON.stringify(checks, null, 2), 'utf8');
  await page.getByRole('button', { name: 'Thêm nhiệm vụ', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.ant-form-item-label label').first()).toHaveCSS('font-size', '14px');
  await expect(page.getByRole('dialog').locator('.ant-form-item-label label').first()).toHaveCSS('font-weight', '600');
});
