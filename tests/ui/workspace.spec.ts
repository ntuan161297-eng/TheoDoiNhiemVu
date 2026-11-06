import { expect, test, type Page, type Locator } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { qaArtifact } from './artifacts';

async function enter(page: Page, viewer = false) {
  await page.goto('/');
  if (viewer) await page.getByText('Lãnh đạo', { exact: true }).click();
  await page.getByRole('button', { name: 'Vào giao diện DEMO' }).click();
  await expect(page.getByTestId('kpi-total').locator('strong')).toHaveText('18');
}
async function choose(page: Page, control: Locator, text: string) {
  await control.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ant-select ")][1]').click();
  await page.locator('.ant-select-dropdown:visible').getByText(text, { exact: true }).click();
}
async function attach(dialog: Locator) {
  await dialog.locator('input[type=file]').last().setInputFiles({ name: 'Tai-lieu-DEMO.txt', mimeType: 'text/plain', buffer: Buffer.from('Tai lieu minh hoa UI mock. Khong phai van ban hanh chinh.') });
}
async function closeDrawer(page: Page) {
  await page.locator('.ant-drawer-close').click();
  await expect(page.locator('.ant-drawer-content')).toHaveCount(0);
}

test('Kiểm tra 5 trang trên desktop, tablet, mobile và chụp ảnh', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await mkdir(qaArtifact(), { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/'); await page.screenshot({ animations: 'disabled', path: qaArtifact('login-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ animations: 'disabled', path: qaArtifact('login-wide.png'), fullPage: true });
  await page.getByRole('button', { name: 'Vào giao diện DEMO' }).click();
  await expect(page.locator('.kpi-card')).toHaveCount(6);
  await expect(page.locator('.unit-table tbody tr[data-row-key]')).toHaveCount(11);
  const routes = [{ label: 'Tổng quan', id: 'dashboard' }, { label: 'Nhiệm vụ', id: 'tasks' }, { label: 'Cần đôn đốc', id: 'expedite' }, { label: 'Báo cáo đơn vị', id: 'reports' }, { label: 'Danh mục', id: 'catalog' }];
  for (const viewport of [{ width: 1366, height: 768, name: 'desktop' }, { width: 1920, height: 1080, name: 'wide' }, { width: 768, height: 1024, name: 'tablet' }, { width: 390, height: 844, name: 'mobile' }]) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.getByRole('navigation').getByRole('button', { name: route.label, exact: route.id !== 'expedite' }).click();
      await expect(page.locator('.page-heading h1')).toHaveText(({ dashboard: 'Tổng quan và cảnh báo', tasks: 'Quản lý nhiệm vụ', expedite: 'Nhiệm vụ cần đôn đốc', reports: 'Báo cáo tổng hợp theo đơn vị', catalog: 'Danh mục và cấu hình' })[route.id]!);
      await page.screenshot({ animations: 'disabled', path: qaArtifact(`${route.id}-${viewport.name}.png`), fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, `Không tràn trang tại ${route.id} ${viewport.name}`).toBeLessThanOrEqual(1);
    }
  }
  await expect(page.getByText('Chặng 1 chỉ có hai vai trò xem thử.', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
});

test('KPI drill-down, lọc AND, thêm/sửa, tiến độ, hoàn thành và snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 }); await enter(page);
  const overdue = Number(await page.getByTestId('kpi-overdue').locator('strong').innerText());
  await page.getByTestId('kpi-overdue').click();
  await expect(page.getByRole('heading', { name: /Danh sách nhiệm vụ/ })).toContainText(`${overdue} nhiệm vụ`);
  await expect(page.locator('.deadline-QUA_HAN')).toHaveCount(overdue);
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await choose(page, page.getByRole('combobox', { name: 'Nguồn nhiệm vụ', exact: true }), 'Nhiệm vụ tỉnh giao');
  await choose(page, page.getByRole('combobox', { name: 'Đơn vị chủ trì', exact: true }), 'Văn phòng HĐND - UBND');
  await expect(page.getByRole('heading', { name: /Danh sách nhiệm vụ/ })).toContainText('1 nhiệm vụ');
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm nhiệm vụ', exact: true }).click();
  let modal = page.getByRole('dialog');
  await modal.screenshot({ animations: 'disabled', path: qaArtifact('form-task-desktop.png') });
  await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(modal.locator('.ant-form-item-explain-error').first()).toBeVisible();
  await choose(page, modal.getByLabel('Nguồn nhiệm vụ', { exact: true }), 'Nhiệm vụ HĐND');
  await modal.getByLabel('Nội dung nhiệm vụ', { exact: true }).fill('DEMO QA — nhiệm vụ kiểm tra đầy đủ luồng');
  await choose(page, modal.getByLabel('Đơn vị chủ trì', { exact: true }), 'Phòng Kinh tế');
  await choose(page, modal.getByLabel('Lãnh đạo chỉ đạo', { exact: true }), 'Nguyễn Văn Luận');
  await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.locator('.drawer-title')).toHaveText('DEMO QA — nhiệm vụ kiểm tra đầy đủ luồng');
  await page.getByRole('tab', { name: 'Tiến độ', exact: true }).click();
  await page.getByRole('button', { name: 'Cập nhật tiến độ', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Nội dung thực hiện', { exact: true }).fill('Đã hoàn tất nội dung minh họa nhưng chưa xác nhận.');
  await modal.getByLabel('Tiến độ (%)', { exact: false }).fill('100');
  await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.locator('.task-drawer .status-tag').first()).toHaveText('Đang thực hiện');
  await page.getByRole('button', { name: 'Xác nhận hoàn thành', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Nội dung kết quả', { exact: true }).fill('Kết quả minh họa đã được Văn phòng kiểm tra.');
  await modal.getByRole('button', { name: 'Xác nhận hoàn thành · DEMO', exact: true }).click();
  await expect(page.locator('.completion-box')).toContainText('Hạn tại thời điểm xác nhận');
  await page.screenshot({ animations: 'disabled', path: qaArtifact('drawer-completed-desktop.png') });
  await expect(page.locator('.task-drawer .status-tag').first()).toHaveText('Đã hoàn thành');
  await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
  modal = page.getByRole('dialog');
  await expect(modal.getByLabel('Hạn hoàn thành gốc', { exact: true })).toBeDisabled();
  await modal.getByLabel('Nội dung nhiệm vụ', { exact: true }).fill('DEMO QA — nhiệm vụ đã sửa sau hoàn thành');
  await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.locator('.drawer-title')).toHaveText('DEMO QA — nhiệm vụ đã sửa sau hoàn thành');
  await page.getByRole('tab', { name: 'Lịch sử', exact: true }).click();
  await expect(page.getByText('Xác nhận hoàn thành', { exact: true })).toBeVisible();
  await closeDrawer(page);
  await page.getByRole('navigation').getByRole('button', { name: 'Tổng quan', exact: true }).click();
  await expect(page.getByTestId('kpi-total').locator('strong')).toHaveText('19');
});

test('Văn bản đôn đốc nhiều nhiệm vụ, sửa không tăng lượt, gia hạn và từ chối lần hai', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 }); await enter(page);
  await page.getByRole('navigation').getByRole('button', { name: /Cần đôn đốc/ }).click();
  const checks = page.locator('.ant-table-tbody tr[data-row-key] input[type=checkbox]');
  await checks.nth(0).check(); await checks.nth(1).check();
  await page.getByRole('button', { name: 'Đôn đốc đã chọn (2)' }).click();
  let modal = page.getByRole('dialog');
  await modal.getByLabel('Số/ký hiệu văn bản', { exact: true }).fill('DEMO-QA-DON-DOC');
  await modal.getByLabel('Nội dung yêu cầu đôn đốc', { exact: true }).fill('Văn bản dùng chung kiểm tra đúng hai nhiệm vụ.');
  await attach(modal); await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await page.locator('.task-name button').first().click();
  await page.getByRole('tab', { name: /Đôn đốc/ }).click();
  await expect(page.getByRole('tab', { name: 'Đôn đốc (4)', exact: true })).toBeVisible();
  await page.locator('.record-card').filter({ hasText: 'DEMO-QA-DON-DOC' }).getByRole('button', { name: 'Sửa', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Nội dung yêu cầu đôn đốc', { exact: true }).fill('Đã sửa văn bản, số lượt phải giữ nguyên.');
  await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Đôn đốc (4)', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Gia hạn', exact: true }).click();
  await expect(page.getByText('Đang xin gia hạn — vẫn tính theo hạn hiện tại', { exact: true })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: qaArtifact('drawer-extension-pending.png') });
  const oldDue = await page.locator('.task-drawer .due-summary b').nth(1).innerText();
  const originalDue = await page.locator('.task-drawer .due-summary b').nth(0).innerText();
  await page.getByRole('button', { name: 'Ghi nhận kết quả xem xét', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Số văn bản phản hồi', { exact: true }).fill('DEMO-QA-DUYET');
  await attach(modal); await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  const approvedDue = await page.locator('.task-drawer .due-summary b').nth(1).innerText();
  expect(approvedDue).not.toBe(oldDue);
  await expect(page.locator('.task-drawer .due-summary b').nth(0)).toHaveText(originalDue);
  await page.getByRole('button', { name: 'Thêm đề nghị gia hạn', exact: true }).click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Số văn bản đề nghị', { exact: true }).fill('DEMO-QA-XIN-LAN-2');
  await modal.getByLabel('Lý do xin gia hạn', { exact: true }).fill('Kiểm tra xin tiếp vẫn giữ hạn duyệt lần một.');
  await attach(modal); await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.locator('.task-drawer .due-summary b').nth(1)).toHaveText(approvedDue);
  await page.getByRole('button', { name: 'Ghi nhận kết quả xem xét', exact: true }).click();
  modal = page.getByRole('dialog');
  await choose(page, modal.getByLabel('Kết quả xem xét', { exact: true }), 'Không chấp thuận');
  await modal.getByLabel('Số văn bản phản hồi', { exact: true }).fill('DEMO-QA-TU-CHOI');
  await attach(modal); await modal.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.locator('.task-drawer .due-summary b').nth(1)).toHaveText(approvedDue);
  await expect(page.locator('.record-card').filter({ hasText: 'DEMO-QA-XIN-LAN-2' })).toContainText('Không được chấp thuận');
});

test('Wizard import lỗi chặn, xác nhận dữ liệu DEMO và vai trò chỉ xem', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 }); await enter(page);
  await page.getByRole('navigation').getByRole('button', { name: 'Nhiệm vụ', exact: true }).click();
  await page.getByRole('button', { name: 'Import Excel', exact: true }).click();
  let modal = page.getByRole('dialog');
  await modal.screenshot({ animations: 'disabled', path: qaArtifact('import-step-1.png') });
  await choose(page, modal.getByRole('combobox'), '01 dòng sai đơn vị — chặn xác nhận');
  await modal.getByRole('button', { name: /Xem trước kịch bản DEMO/ }).click();
  await expect(modal.getByRole('button', { name: /Tiếp tục xác nhận/ })).toBeDisabled();
  await expect(modal.getByText('Có lỗi chặn. Chưa ghi bất kỳ nhiệm vụ nào.')).toBeVisible();
  await modal.screenshot({ animations: 'disabled', path: qaArtifact('import-step-2-error.png') });
  await modal.getByRole('button', { name: 'Quay lại / đổi kịch bản' }).click();
  await choose(page, modal.getByRole('combobox'), '03 dòng hợp lệ');
  await modal.getByRole('button', { name: /Xem trước kịch bản DEMO/ }).click();
  await modal.getByRole('button', { name: /Tiếp tục xác nhận/ }).click();
  await modal.screenshot({ animations: 'disabled', path: qaArtifact('import-step-3.png') });
  await modal.getByRole('button', { name: 'Xác nhận mô phỏng import' }).click();
  await expect(modal.getByText('Đã thêm 3 nhiệm vụ DEMO', { exact: true })).toBeVisible();
  await modal.getByRole('button', { name: 'Xem nhiệm vụ vừa nhập' }).click();
  await expect(page.getByRole('heading', { name: /Danh sách nhiệm vụ/ })).toContainText('3 nhiệm vụ');
  await page.getByRole('button', { name: /Cán bộ Văn phòng Vai trò xem thử/ }).click();
  await page.getByText('Xem thử: Lãnh đạo chỉ xem', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Thêm nhiệm vụ', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Import Excel', exact: true })).toHaveCount(0);
  await page.locator('.task-name button').first().click();
  await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Tiến độ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Xác nhận hoàn thành', exact: true })).toHaveCount(0);
});

test('Mobile: mở biểu mẫu, cập nhật tiến độ và xem trạng thái rỗng', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ animations: 'disabled', path: qaArtifact('login-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Vào giao diện DEMO' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Nhiệm vụ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quản lý nhiệm vụ', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Thêm nhiệm vụ', exact: true }).click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByLabel('Nội dung nhiệm vụ', { exact: true })).toBeVisible();
  await modal.screenshot({ animations: 'disabled', path: qaArtifact('form-task-mobile.png') });
  expect(await modal.evaluate(el => el.getBoundingClientRect().width)).toBeLessThanOrEqual(390);
  await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
  await page.locator('.task-name button').first().click();
  await page.getByRole('tab', { name: 'Tiến độ', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: qaArtifact('drawer-progress-mobile.png') });
  await page.getByRole('button', { name: 'Cập nhật tiến độ', exact: true }).click();
  const update = page.getByRole('dialog');
  await update.getByLabel('Nội dung thực hiện', { exact: true }).fill('Cập nhật minh họa từ màn hình mobile.');
  await update.getByRole('button', { name: 'Lưu minh họa', exact: true }).click();
  await expect(page.getByText('Cập nhật minh họa từ màn hình mobile.', { exact: true })).toBeVisible();
  await closeDrawer(page);
  await page.getByRole('textbox', { name: 'Tìm kiếm nhiệm vụ', exact: true }).fill('KHONG-TON-TAI-QA');
  await expect(page.getByText('Không có nhiệm vụ phù hợp', { exact: true })).toBeVisible();
  await page.screenshot({ animations: 'disabled', path: qaArtifact('tasks-empty-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('Báo cáo tải CSV đúng bộ lọc và đủ 11 đơn vị', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 }); await enter(page);
  await page.getByTestId('kpi-overdue').click();
  const [details] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Xuất CSV/ }).click()]);
  const detailCsv = await readFile((await details.path())!, 'utf8');
  expect(detailCsv.startsWith('\uFEFF')).toBe(true);
  expect(detailCsv.split('\r\n')).toHaveLength(5);
  await page.getByRole('navigation').getByRole('button', { name: 'Báo cáo đơn vị', exact: true }).click();
  await page.getByRole('button', { name: /Xuất báo cáo/ }).click();
  const [summary] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: 'Tổng hợp 11 đơn vị · CSV DEMO', exact: true }).click()]);
  const summaryCsv = await readFile((await summary.path())!, 'utf8');
  expect(summaryCsv.split('\r\n')).toHaveLength(12);
  expect(summaryCsv).toContain('Trạm y tế xã Hương Đô');
  expect(summaryCsv).toContain('"Phòng Văn hóa - Xã hội","0"');
});
