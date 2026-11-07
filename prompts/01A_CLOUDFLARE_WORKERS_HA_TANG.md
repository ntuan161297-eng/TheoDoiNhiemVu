# CHẶNG A — WORKERS STATIC ASSETS + WORKER API

Đọc `docs/cloudflare/STAGE_A_WORKERS_REQUEST.md` (yêu cầu mới nhất), master đã hợp nhất, kế hoạch và bảng truy vết. Kiểm tra local/Git status, giữ thay đổi chưa commit và backup trước khi sửa. Không tạo frontend hoặc Pages Project mới. Không thay Vercel.

Giữ nguyên UI/Design System/DEMO/domain tests. Tích hợp Worker entry TypeScript tại `worker/index.ts`. Wrangler truyền thống với `main`, `assets.directory=dist`, `ASSETS`, SPA fallback và `run_worker_first=["/api","/api/*"]`; không dùng Pages Functions hoặc Cloudflare Vite plugin trong cấu hình này.

GET/HEAD `/api/health`: 200 JSON `{"status":"ok","service":"theo-doi-nhiem-vu-api"}`, `application/json; charset=utf-8`, no-store, HEAD không body. Method khác 405/Allow; API không tồn tại 404 JSON, kể cả Sec-Fetch-Mode navigate. Health không tiết lộ env/secrets; business API chưa được mở. Client `src/services/api.ts` dùng đường dẫn tương đối, kiểu dữ liệu và xử lý lỗi; chưa nối vào DemoProvider.

D1/R2 chỉ có contract optional và ví dụ không active; không database/schema/migration/Auth thật ở A. Không cài phần mềm hệ thống, push main, deploy Preview/Production, chạy SQL remote hoặc đưa dữ liệu nội bộ lên Cloud.

Kiểm tra `npm run build`, `npm run build:worker` (dry-run), `npm run test`, `npm run test:ui:worker`; API thực tế trên workerd, mở trực tiếp/reload cả sáu UI routes, assets JS/CSS, navigation API, desktop/tablet/mobile và thao tác UI cũ. Báo kết quả HTTP/Content-Type, file thay đổi, nguyên nhân health từng trả HTML, local URL và hướng dẫn Preview qua nhánh riêng. Sau kiểm thử local dừng để chủ sản phẩm nghiệm thu trước Preview hoặc B.
