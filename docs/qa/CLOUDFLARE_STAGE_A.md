# Báo cáo Chặng A — Cloudflare Pages tích hợp vào dự án hiện có

Hoàn tất kiểm tra local ngày 06/11/2026. **Chỉ Chặng A; chưa bắt đầu B.**

## Bảo toàn local và so sánh GitHub

- Đã fetch origin, so sánh HEAD với origin/main trước khi sửa: `0 0`, cùng commit `ad95f59`; không có thay đổi remote cần ghi đè lên local.
- Nhánh riêng `feat/cloudflare-pages-stage-a`; checkpoint trước tích hợp `408cfac` giữ cả các file Supabase và sửa Vercel 404 đã hoàn thiện nhưng chưa push.
- ZIP trước tích hợp: `backups/before-cloudflare-stage-a-20261105-171042-90b00553.zip`, 136 file, 15.806.668 bytes; SHA-256 `cdcb3eded8a1cd7381f9d3d15eca50b02ecec561802c3eabe2ae21d3c854c549`. Đã kiểm tra ZIP/CRC. Bỏ dependency, build, env, Git metadata, logs/state và backup khỏi archive.
- Không push, đổi main, merge remote, đổi Vercel Production hoặc xóa dữ liệu. Bản sửa vercel.json chỉ được giữ ở checkpoint local.

## File tạo/sửa trong Chặng A

| Nhóm | File |
|---|---|
| Pages cấu hình | `wrangler.jsonc`, `public/_routes.json`, `tsconfig.functions.json` |
| Functions | `functions/api/health.ts`, `_middleware.ts`, `[[path]].ts` |
| Contract/helpers | `shared/api.ts`, `server/env.ts`, `server/http.ts` |
| Frontend API | `src/services/api.ts`, `api.test.ts` — chưa nối vào UI |
| Dev tools | `scripts/wrangler-local.mjs`, `prepare-pages-runtime.ps1`, package/lockfile, .gitignore, Vite proxy, Vitest include |
| Test | `tests/functions/health.test.ts`, `tests/pages/infrastructure.spec.ts`, `playwright.pages.config.ts`, `tests/ui/artifacts.ts`; hai spec UI cũ chỉ đổi chỗ xuất artifact có thể cấu hình |
| Tài liệu | `docs/cloudflare/README.md`, mẫu binding tham khảo, báo cáo này, kế hoạch/README và đánh dấu tài liệu Supabase là lịch sử |

App, DemoProvider, demo data, domain rules, pages, Login, TaskForms, TaskDrawer, ImportWizard, BusinessClock, CSS/font/ảnh được so sánh với checkpoint và giữ nguyên. Ảnh nghiệm thu cũ không bị ghi đè. Chưa thêm TreeView hoặc âm lịch vào UI, chưa mở các chức năng ngoài Chặng A.

## Kết quả xác minh

| Kiểm tra | Kết quả |
|---|---|
| TypeScript frontend + Functions | Đạt |
| Vite production build | Đạt; cảnh báo bundle >500 kB như trước |
| Wrangler Pages Functions build | Đạt |
| Unit tests | 26/26 đạt, gồm 14 test cũ |
| Browser tests trên Pages/workerd | 9/9 đạt, gồm toàn bộ 7 bài UI cũ |
| API thật `/api/health` | HTTP 200, JSON, request ID, giờ Việt Nam; dependency ghi chưa bật |
| HEAD/POST health | 200 không body / 405 với Allow GET, HEAD |
| API chưa triển khai | JSON 404, không bị SPA fallback; không mở dù có bearer giả |
| UI direct/reload | Sáu route và query string hoạt động; desktop/tablet/mobile UI cũ đạt |
| Static resources | JS, CSS/font/ảnh/favicon tải được; chỉ API thuộc invocation routes |
| Supabase SQL lịch sử | 404 kiểm tra tĩnh vẫn đạt; không thực thi SQL |

Native workerd ban đầu crash trên Windows 10 Pro 1909 với VC++ 14.26 hệ thống. Đã giải quyết trong workspace: dùng bản workerd cùng bộ DLL Microsoft 14.51 ký hợp lệ có sẵn trong Edge, chỉ sao chép vào `.local/cloudflare/workerd-runtime`; runner xác minh hash và không thay Windows/System32/registry/PATH. Đã khởi động lại bằng lệnh chuẩn không cần đặt biến môi trường thủ công và xác nhận Ready. Không hạ phiên bản Wrangler hoặc giả lập Node backend để thay Pages.

Wrangler 4.157.0 và Workers types 5.20261104.1 là dev dependencies ghim phiên bản. Cache/logs/state/DLL ở .local hoặc .wrangler được ignore; không có token, D1 ID, R2 resource hoặc Auth secret trong cấu hình.

## Nghiệm thu và giới hạn

Mở `http://127.0.0.1:8788/`; API `http://127.0.0.1:8788/api/health`. Đã mở trình duyệt cho người dùng khi được yêu cầu. Lệnh chạy lại và hướng dẫn Preview/GitHub ở [hướng dẫn Cloudflare](../cloudflare/README.md).

Auth thật, membership/tenant isolation, Super Admin, cơ sở dữ liệu D1, bucket R2, invitation/reset password, CRUD bền vững chưa triển khai. Middleware hiện là boundary chỉ mở health, không được mô tả là Auth/RBAC hoàn chỉnh. Database migration PostgreSQL cũ chỉ là tài liệu giữ lại, không là schema D1. Không thực hiện SQL remote, tạo account/Admin, gửi email, tạo Cloudflare project hoặc deploy.

**Dừng chờ chủ sản phẩm nghiệm thu Chặng A trước khi triển khai Chặng B.**
