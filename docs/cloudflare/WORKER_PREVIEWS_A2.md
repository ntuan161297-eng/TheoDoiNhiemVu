# Chặng A.2 — Cloudflare Worker Previews cô lập

Cập nhật 07/11/2026. Chỉ Preview với dữ liệu DEMO; không deploy Production, migration D1, R2 hoặc Auth thật. Yêu cầu A.2 thay hướng dẫn cũ dùng `env.preview` và `wrangler deploy --env preview`.

## Cấu hình trong repository

- Parent Worker: **theodoinhiemvu**, giữ đúng tên Worker đã có trên Cloud. Đây không phải tên một Worker Preview mới tạo bằng deploy.
- `main=worker/index.ts`, assets `dist`/`ASSETS`, SPA fallback, `/api` và `/api/*` Worker-first giữ nguyên.
- **`previews`** chứa `vars.APP_ENV=preview`, `d1_databases=[]`, `r2_buckets=[]`. Không named `env.preview`; không secret/service binding hoặc resource ID thật.
- Wrangler project ghim **4.157.0**, hỗ trợ `wrangler preview`; yêu cầu tính năng từ **4.135.0**. Không cần nâng dependency. [Yêu cầu phiên bản](https://developers.cloudflare.com/workers/previews/get-started/).
- `preview_urls` chỉ là công tắc Version URLs, không thay khối `previews` hoặc tính năng Worker Previews. Không dùng `wrangler versions upload` cho A.2.
- `npm run check:preview` kiểm tra offline bằng parser chính Wrangler: entry/static routing, phiên bản, Preview vars/bindings và command. Kết quả này **không xác nhận Dashboard hoặc tài nguyên Cloud**.
- `npm run preview:worker` gọi check rồi **`wrangler preview --ignore-base-config`**. Không chạy cho tới khi xác nhận account/Builds an toàn. `--ignore-base-config` bỏ Previews Base khi tạo Preview mới; không xóa secrets/bindings của Preview cùng tên đã tồn tại.

Assets/compatibility settings vẫn ở cấp gốc; dữ liệu và vars của Preview đặt trong `previews`. B/D sau này phải thêm binding trỏ tài nguyên test riêng và cập nhật gate kiểm tra sau khi được duyệt; không copy ID/secret Production. [Cấu hình chính thức](https://developers.cloudflare.com/workers/previews/configuration/).

## Kiểm tra thủ công trên Dashboard trước push

Vào **Workers & Pages → theodoinhiemvu → Settings → Builds**. Giao diện có thể ghi Build thay cho Builds; mở các phần Git connection, Build configuration và Branch control.

| Mục | Giá trị cần xác nhận |
|---|---|
| Git repository | `ntuan161297-eng/TheoDoiNhiemVu` |
| Root directory | Root repository, không phải `dist` |
| Worker name | `theodoinhiemvu`, khớp `wrangler.jsonc` |
| Production branch | **main**, không phải nhánh feature |
| Enable Preview Builds | Bật cho nhánh ngoài main; không loại `feature/cloudflare-worker-stage-a` |
| Build command | **npm run build** |
| Preview command | **npx wrangler preview --ignore-base-config** |
| Node version | 22 |
| Preview vars | APP_ENV=preview; không dùng secrets Production |
| Preview resources | A.2 không D1/R2/service bindings/secrets; không trỏ Production |

Không thay Production deploy command/traffic/DNS trong A.2. Không dùng deploy command Production làm Preview command. Không nhấn Deploy Production hoặc đổi Production branch sang feature.

Nếu còn banner **Set up Worker Previews**, Worker đang dùng mô hình preview cũ. Người dùng mở Set up, xem vars/secrets/bindings dành riêng cho Preview, kiểm tra Preview command, rồi chọn **Switch to Worker Previews** nếu đồng ý. Cloudflare ghi rõ việc chuyển mô hình không thể đảo ngược; không tự bấm hoặc suy đoán đã chuyển. Nếu không thấy lựa chọn này, dừng và xác minh account/quyền hỗ trợ; không fallback sang versions upload hoặc deploy Production. [Hướng dẫn Branch control và chuyển mô hình](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/).

Kiểm tra **Previews Base** và Preview cùng tên nếu có: A.2 không cần secrets hoặc tài nguyên. Không xóa/sửa secrets Production. `--ignore-base-config` không thay việc kiểm tra Preview đã tồn tại. Không đưa secret/token vào nội dung phản hồi, repository hoặc biến VITE_*.

## Nhánh và điều kiện push

Nhánh được yêu cầu: **feature/cloudflare-worker-stage-a**. Commit local bao gồm Chặng A và tài liệu liên quan; đã sao lưu trước khi chỉnh sửa A.2. Không push main/force push.

**Chỉ push sau khi đã xác nhận toàn bộ cấu hình Builds ở trên.** Chưa xác nhận được thì dừng trước push, báo đúng trạng thái và hướng dẫn người dùng hoàn tất Dashboard. Đăng nhập CLI không tự xác nhận cấu hình Git Builds.

Sau khi được xác nhận an toàn:

```powershell
git push -u origin feature/cloudflare-worker-stage-a
```

Đây là hướng dẫn, chưa phải lịch sử lệnh đã chạy. Cloudflare Builds phải lấy config từ nhánh feature và chạy build → Preview command. Lấy **Preview URL thực tế** và Unique Deployment URL từ log/Dashboard, không đoán địa chỉ, không dùng URL Production làm bằng chứng.

Nếu deploy Preview qua CLI thay vì Builds: người dùng chạy `npx wrangler login` và `npx wrangler whoami`, xác nhận đúng account và Worker có sẵn trước khi chạy `npm run build` rồi `npm run preview:worker`. Máy hiện kiểm tra là chưa đăng nhập; không dùng temporary account, không đưa token lên chat. Chưa thực hiện CLI deploy trong lúc cấu hình account/Builds chưa được xác nhận.

## Kiểm thử khi đã có URL thực tế

```powershell
$env:WORKER_PREVIEW_URL = 'URL_PREVIEW_THUC_TE_TU_CLOUDFLARE'
npm run test:ui:preview
```

URL phải là HTTPS Preview workers.dev origin, không path/query; config chặn hostname Production. Bộ test chạy 7 bài UI cũ cùng 2 bài hạ tầng, không khởi động server local: login DEMO, Dashboard, Nhiệm vụ, Cần đôn đốc, Báo cáo, Danh mục; direct/reload, JS/CSS, thao tác DEMO và API health/404/405/HEAD/navigation. Ảnh/log riêng trong `.local/cloudflare/preview-*`.

| Request cần nghiệm thu | Kỳ vọng |
|---|---|
| GET /api/health, fetch và navigate | 200, JSON chính xác `{"status":"ok","service":"theo-doi-nhiem-vu-api"}` |
| Health headers | `application/json; charset=utf-8`, `Cache-Control: no-store` |
| GET /api/khong-ton-tai | 404 JSON, không index.html |
| POST /api/health và method không hỗ trợ | 405, Allow GET/HEAD |
| UI direct/reload | 200 HTML, React render bình thường |
| JS/CSS/assets | 200, đúng MIME |

Không coi test local là test Preview. Nếu chưa có URL hoặc chưa chạy được test, đánh dấu **chưa kiểm thử Preview**. Sau khi Preview hoạt động, dừng chờ nghiệm thu; chưa tự chuyển B hoặc deploy Production.
