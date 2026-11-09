# Workers Static Assets + Worker API — Chặng A

> **B1.2, 09/11/2026:** D1 TEST `theodoinhiemvu-d1-test` (UUID `649fd0db-7fd3-4551-bfac-f3fccc408373`) đã áp dụng đủ 5 migration. Có 20 bảng ứng dụng, đúng seed 11/3/3; không profile/task/tenant A/B. FK check và quick_check đạt; integrity_check bị D1 từ chối SQLITE_AUTH, không đánh dấu đạt. Chỉ chuẩn bị binding Preview local, chưa push/deploy/Auth/R2. [Báo cáo B1.2 và hướng dẫn Preview](../qa/D1_B1_2.md). Các trạng thái B1/A.2 cũ bên dưới là lịch sử trước B1.2.

> **Hiện tại 09/11/2026:** A/Preview đã được chủ sản phẩm nghiệm thu. B1 D1 đa tenant đã kiểm thử local, chưa nối UI/Preview vào DB. [Thiết kế/lệnh local/D1 TEST](D1_B1.md), [báo cáo B1](../qa/D1_B1.md). Các phần A.2 dưới đây ghi lại quy trình trước B1; không tự chạy deploy/remote migration.

Cập nhật 06/11/2026 theo [yêu cầu mới nhất, nguyên văn](STAGE_A_WORKERS_REQUEST.md). Dùng **Workers Static Assets + Worker API**, Wrangler truyền thống; không dùng Cloudflare Vite plugin hoặc tạo Pages Project. [Master hợp nhất](MASTER_PROMPT.md), [kế hoạch](../IMPLEMENTATION_PLAN.md), [truy vết](REQUIREMENTS_TRACEABILITY.md), [báo cáo kiểm thử](../qa/CLOUDFLARE_WORKERS_STAGE_A.md).

## Mở ứng dụng local

Mở **http://127.0.0.1:8788/**, chọn vai trò và bấm **Vào giao diện DEMO**. API: **http://127.0.0.1:8788/api/health**. Nếu server chưa chạy:

```powershell
cd D:\ubnd-huong-do-tasks
npm run dev:worker
```

Lệnh build React và typecheck frontend/Worker, rồi chạy `wrangler dev` trên workerd thật, cùng origin 8788. Khi đã build: `npm run worker:serve`. Giữ terminal khi chạy bằng tay. `npm run dev` vẫn chạy Vite hot reload tại 5173, proxy `/api` sang Worker 8788; phải chạy Worker nếu cần gọi API. Vite preview riêng không có API.

Máy mới chạy `npm ci`. Đã kiểm tra Node 22.14.0, Wrangler ghim 4.157.0, Workers types 5.20261104.1. Không thêm dependency; package-lock giữ nguyên. Không cần tài khoản Cloudflare, D1, R2, Docker, .NET hoặc SQL Server để kiểm tra A local.

Windows 10 hiện tại dùng runtime Microsoft có sẵn trong Edge, xác minh chữ ký/hash và chỉ copy cạnh workerd trong `.local`; không sửa System32/registry/PATH. Nếu chưa chuẩn bị hoặc workerd đổi phiên bản:

```powershell
npm run prepare:worker-runtime
npm run dev:worker
```

Script không tải/cài phần mềm hệ thống. Windows 11/Linux tương thích không cần workaround này. DLL/binary/state/logs không vào Git. [Yêu cầu OS chính thức](https://developers.cloudflare.com/workers/wrangler/install-and-update/).

## Kiến trúc hoạt động

- `wrangler.jsonc`: Worker gốc `theodoinhiemvu`, `main=worker/index.ts`, compatibility date 2026-11-06. Chưa upload cấu hình này lên Cloud.
- Assets `dist`, binding `ASSETS`, SPA fallback. `run_worker_first=["/api","/api/*"]` ưu tiên API, kể cả navigation; JS/CSS/font/ảnh dùng static assets.
- `worker/index.ts`: GET/HEAD health; API chưa có trả 404 JSON; method health khác trả 405/Allow. Chưa Auth/middleware quyền backend.
- `server/env.ts`, `server/http.ts`, `shared/api.ts`: binding contract, JSON/request ID, headers, kiểu dữ liệu. Health không trả env/secrets/readiness DB giả.
- `src/services/api.ts`: đường dẫn tương đối cùng origin, TypeScript, xử lý HTTP/HTML sai định dạng, bearer/tenant contract cho tương lai. Chưa nối vào DemoProvider/login hoặc nghiệp vụ.
- D1/R2 chỉ có contract optional chưa gắn và [ví dụ không active](wrangler.bindings.example.jsonc). Chưa database/Auth/storage/tenant isolation thật.

Health 200, `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`; HEAD không body:

```json
{"status":"ok","service":"theo-doi-nhiem-vu-api"}
```

Mã Pages cũ được bảo toàn trong [archive](../archive/2026-11-06-before-workers/README.md) và ZIP; đã bỏ khỏi build/test hiện hành. Không dùng `pages_build_output_dir`, `functions/`, `_routes.json`, `wrangler pages dev/deploy` cho Worker này. `vercel.json` giữ nguyên.

## Kiểm thử

```powershell
npm run build
npm run build:worker
npm run test
npm run test:ui:worker
curl.exe -i http://127.0.0.1:8788/api/health
curl.exe -i -H "Sec-Fetch-Mode: navigate" http://127.0.0.1:8788/api/health
curl.exe -i -H "Sec-Fetch-Mode: navigate" http://127.0.0.1:8788/api/khong-ton-tai
```

`build:worker` gọi **deploy --name theodoinhiemvu-build-check --dry-run**, chỉ bundle local, không upload/deploy. 28 unit + 9 browser tests đạt trên workerd; bao gồm direct/reload sáu UI routes, API fetch/navigation/404/405/HEAD và JS/CSS/ảnh. Toàn bộ 7 bài UI cũ giữ nguyên assertion; ảnh mới ở `.local/cloudflare/worker-qa`. Còn cảnh báo bundle Vite lớn, không chặn build.

## Lịch sử thiết lập Worker Previews A.2/A.3

Theo yêu cầu A.2, dùng **Worker Previews thực sự**, không Worker riêng env.preview, không versions upload. Khối previews đã có APP_ENV=preview, D1/R2 rỗng; Wrangler 4.157.0 đáp ứng yêu cầu >=4.135.0. preview_urls không thay tính năng này.

Nhánh Preview đã nghiệm thu: **feature/cloudflare-preview-clean**, base 50d6b10. B1 đang ở nhánh local **feature/d1-multitenant-b1**, không push/deploy. Dashboard A.3 được chủ sản phẩm xác nhận dùng build npm run build, Preview command npx wrangler preview; helper CLI trong repo vẫn là tùy chọn khác có ignore-base-config.

Trên Dashboard: **Workers & Pages → theodoinhiemvu → Settings → Builds**:

| Mục | Giá trị cần kiểm tra |
|---|---|
| Repository/root | ntuan161297-eng/TheoDoiNhiemVu, root repo |
| Production branch | main |
| Enable Preview Builds | Bật, cho phép nhánh feature/cloudflare-worker-stage-a |
| Build command | npm run build |
| Preview command | npx wrangler preview --ignore-base-config |
| Worker name | theodoinhiemvu |
| Node | 22 |
| Preview resources/secrets | Không có ở A.2, không dùng chung Production |

Nếu còn banner **Set up Worker Previews**, xem hướng dẫn chuyển mô hình một lần trước khi push. Không sửa Production branch/deploy command/traffic. CLI chưa đăng nhập: người dùng chạy npx wrangler login và npx wrangler whoami khi chọn cách CLI; không gửi token lên chat.

[Hướng dẫn A.2 đầy đủ: chuyển mô hình, Previews Base, push và kiểm thử](WORKER_PREVIEWS_A2.md). [Báo cáo trạng thái A.2](../qa/CLOUDFLARE_WORKER_PREVIEWS_A2.md).

Sau khi account và Builds đã xác nhận an toàn, lệnh Preview local là npm run preview:worker, gọi wrangler preview --ignore-base-config. Lệnh chưa thực hiện. Cờ bỏ Base chỉ áp dụng khi tạo mới; phải kiểm tra riêng secrets/bindings nếu Preview cùng tên đã tồn tại. Không sử dụng wrangler deploy hoặc wrangler versions upload làm đường triển khai A.2.

Khi có URL thực tế từ log/Cloudflare Dashboard, đặt WORKER_PREVIEW_URL và chạy npm run test:ui:preview. Cấu hình từ chối hostname Production, chạy toàn bộ 9 bài frontend/API trên Preview, không mở server local. Không dùng test local để tuyên bố Preview đạt. Dừng chờ nghiệm thu sau Preview, chưa chuyển B.

## Kiểm tra D1 TEST B1.2

Database TEST đã migrate, không chạy lại apply. Dùng `node scripts/d1-test-remote.mjs inspect` để đọc trạng thái với config riêng đã được ignore. `npm run check:preview` xác nhận chỉ một UUID TEST trong previews và Production bindings bằng 0. Chi tiết SQL, integrity_check bị từ chối và các bước deploy Preview sau nghiệm thu tại [báo cáo B1.2](../qa/D1_B1_2.md). Không deploy/push hoặc chạy Auth/R2 trong lượt này.
