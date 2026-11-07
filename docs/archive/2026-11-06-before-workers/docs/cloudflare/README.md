# Chạy local và triển khai Cloudflare Pages — Chặng A

Cập nhật 06/11/2026. Tích hợp vào frontend hiện có, không tạo ứng dụng mới. Chặng A đã chạy frontend + Pages Functions trên workerd local; UI và đăng nhập vẫn DEMO. Chưa có database nghiệp vụ, Auth thật, R2 hoặc phân quyền đa Tenant. Không deploy, push GitHub hay thay Vercel Production trong lượt tích hợp.

Yêu cầu đầy đủ tại [master nguyên văn](MASTER_PROMPT.md); [kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) đã viết lại hoàn toàn theo Cloudflare; [bảng đối chiếu](REQUIREMENTS_TRACEABILITY.md) ghi rõ từng mục đã làm/chuẩn bị/chưa triển khai. Trang này là hướng dẫn chạy và triển khai, không thay thế toàn bộ yêu cầu sản phẩm.

## Mở ứng dụng trên máy hiện tại

Mở `http://127.0.0.1:8788/`, chọn vai trò, bấm **Vào giao diện DEMO**. API: `http://127.0.0.1:8788/api/health`.

Nếu server đã tắt, mở PowerShell tại dự án:

```powershell
cd D:\ubnd-huong-do-tasks
npm run dev:pages
```

Lệnh build frontend, typecheck Functions rồi chạy chung một origin 8788. Khi đã build và chỉ cần khởi động lại: `npm run pages:serve`. Giữ cửa sổ terminal nếu chạy bằng tay. `npm run dev` vẫn là Vite tại 5173, proxy `/api` đến Pages 8788 khi server Pages đang chạy.

Máy mới chạy `npm ci` trước. Node đã kiểm tra: 22.14.0. Wrangler ghim 4.157.0; Workers types 5.20261104.1. Không cần .NET, SQL Server, PostgreSQL, Docker hoặc tài khoản Cloudflare để chạy Chặng A local.

### Trường hợp Windows hiện tại

Máy này Windows 10 Pro 1909; native workerd lúc đầu lỗi `0xc0000005`. Đã chạy được bằng DLL Microsoft 14.51 có sẵn trong Edge, xác minh chữ ký và chỉ sao chép cạnh workerd trong `.local/cloudflare/workerd-runtime`. Không cài VC++ hoặc sửa System32/registry/PATH. DLL, binary, logs và state không vào Git.

Khi `.local` chưa được chuẩn bị trên **máy Windows này**, chạy một lần:

```powershell
npm run prepare:pages-runtime
npm run dev:pages
```

Script chỉ dùng bộ DLL Microsoft có sẵn, không tải/cài thư viện hệ thống; có thể chỉ định thư mục runtime Microsoft đã có qua biến process `CLOUDFLARE_VC_RUNTIME_DIR`. Runner kiểm tra hash binary/DLL trước khi dùng, yêu cầu chuẩn bị lại khi workerd thay phiên bản. Máy Windows 11/Linux tương thích chạy bình thường mà không cần bước này. Không coi giải pháp local này là thay đổi danh sách OS được Cloudflare hỗ trợ. [Yêu cầu Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/), [Microsoft app-local runtime](https://learn.microsoft.com/en-us/cpp/windows/deployment-in-visual-cpp?view=msvc-170).

## Đang có gì

- `wrangler.jsonc`: cấu hình **Pages**, `pages_build_output_dir=dist`, compatibility date 2026-11-01; vars development/staging/production tách riêng. Không có Workers Static Assets `main/assets` hoặc resource ID thật.
- `functions/api/health.ts`: GET/HEAD health, POST trả 405. JSON có stage/mode, giờ Việt Nam và request ID; dependency DB/Auth/Storage ghi rõ chưa bật. Đây không phải phép kiểm tra DB/Auth/R2 đã kết nối.
- `functions/api/_middleware.ts`: correlation ID, no-store, lỗi JSON không lộ stack; chỉ health được mở. API nghiệp vụ/tenant khác trả 404 kể cả gửi bearer token chưa xác minh. Chưa phải middleware Auth hoàn chỉnh.
- `public/_routes.json`: chỉ `/api` và `/api/*` chạy Functions. JS/CSS/font/ảnh và đường dẫn UI dùng Pages static hosting. Không tạo `404.html`, dùng SPA fallback mặc định; reload các route hoạt động. API không tồn tại giữ JSON 404, không bị trả HTML SPA.
- `src/services/api.ts`: typed client same-origin, JSON envelope/lỗi, cancellation, bearer/tenant header cho bước sau; **chưa nối vào DemoProvider/login**. Không lấy role DEMO làm token hoặc quyền.
- Contract D1 binding `DB`, R2 binding `DOCUMENTS` ở `server/env.ts`. Mẫu cấu hình ở `wrangler.bindings.example.jsonc` chỉ tham khảo, không được CLI tự load; chưa tạo/gắn D1/R2 thật.

Thay đổi DEMO vẫn mất khi reload theo thiết kế cũ. Đồng hồ Việt Nam giữ nguyên; chưa thêm ngày âm hay TreeView nếu trước đó chưa có.

## Kiểm tra đã chạy

```powershell
npm run build
npm run build:functions
npm run test
npm run test:ui:pages
```

- Frontend và Functions typecheck/build thành công. Cảnh báo bundle Vite >500 kB vẫn còn, không có lỗi build chặn.
- 26 unit tests đạt (14 nghiệp vụ cũ, 6 client, 6 Functions).
- 9 bài browser đạt: toàn bộ 7 bài UI cũ và 2 bài Pages/API, gồm desktop/tablet/mobile, biểu mẫu/drawer/import DEMO/gia hạn/đôn đốc/KPI/xuất CSV và direct-link/reload.
- Ảnh QA mới ở `.local/cloudflare/qa`; không ghi đè ảnh nghiệm thu cũ. Test API/asset thực hiện trên **Pages/workerd thật**, không phải Vite preview hoặc Node API thay thế.
- SQL Supabase cũ vẫn qua 404 kiểm tra tĩnh, chưa thực thi. Chúng được giữ làm lịch sử/tham khảo, **không dùng làm migration D1**.

## Đưa bản hiện tại lên Cloudflare Preview bằng CLI

Đây là hướng dẫn để chủ sản phẩm thực hiện/phê duyệt, **chưa được chạy**. Bản mới đang ở nhánh local `feat/cloudflare-pages-stage-a`; không cần push hoặc thay Vercel nếu dùng cách CLI này.

Chọn cách quản lý project trước: **Git integration** phù hợp nếu muốn tự build từ GitHub lâu dài. **Direct Upload bằng CLI** phù hợp để đưa bản local lên thử ngay; project Direct Upload không đổi sang Git integration tại chỗ, muốn chuyển phải tạo project khác. Không kéo thả mỗi thư mục dist lên Dashboard vì cách đó không biên dịch thư mục Functions. [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Với một project thử nghiệm mới dùng Direct Upload, chạy từ **root dự án**, không chạy trong dist:

```powershell
cd D:\ubnd-huong-do-tasks
npm run build
npx wrangler login
npx wrangler pages project create theo-doi-nhiem-vu --production-branch main
npx wrangler pages deploy dist --project-name theo-doi-nhiem-vu --branch feat/cloudflare-pages-stage-a
```

Browser mở để anh đăng nhập và cấp quyền Cloudflare; không gửi token/mật khẩu vào chat. Lệnh create chỉ dùng khi project chưa tồn tại. Nếu tên đã có, kiểm tra project/chủ sở hữu và Production branch trước, không ghi đè project không rõ nguồn.

`--branch feat/cloudflare-pages-stage-a` khác Production branch `main` nên nhắm Preview. Giữ cờ branch này; không bỏ để tránh chọn nhầm môi trường. Nếu project có sẵn, phải xác nhận Production branch thực tế không trùng nhánh preview. CLI tự biên dịch `functions/` từ root cùng assets dist và trả URL Preview; dùng chính URL CLI trả về, không đoán địa chỉ. [Pages CLI](https://developers.cloudflare.com/workers/wrangler/commands/pages/).

Sau deploy Preview, kiểm tra URL `/`, `/api/health`, `/tong-quan`, `/nhiem-vu`, `/bao-cao`; F5 trên các trang; `/api/tasks` phải JSON 404 ở Chặng A. Health môi trường Preview phải ghi staging, không có DB/Auth/Storage enabled. Chưa đưa tài liệu thật hoặc dữ liệu nội bộ lên Cloudflare.

## Nếu muốn kết nối GitHub để tự build

1. Commit và push **nhánh tích hợp** lên repository `ntuan161297-eng/TheoDoiNhiemVu` sau khi cho phép. Hiện main trên GitHub chưa có phần Cloudflare này; không deploy nhầm bản main cũ.
2. Trong Dashboard: **Workers & Pages → Create application → Pages → Connect to Git**, chọn GitHub/repo trên. Chọn Pages, không chuyển sang Workers Static Assets.
3. Cấu hình: Framework **Vite**, build command **`npm run build`**, output **`dist`**, root **root repository** (để trống hoặc `/`), Node **22**. Dùng tên project phù hợp `name` trong Wrangler; đối chiếu cấu hình trước deploy.
4. Xác định Production branch và preview branch controls trước khi bấm **Save and Deploy**. Đó là thao tác triển khai thật, cần phê duyệt môi trường; không dùng bước tạo project để âm thầm phát hành Production. Các nhánh khác Production dùng Preview theo thiết lập của project.
5. Functions lấy từ thư mục functions ở root; các var/config Preview/Production cần đúng môi trường. Không thêm secret/service_role vào `VITE_*`. Chặng A chưa cần D1/R2 binding hoặc Auth secrets.

Chưa thực hiện thao tác Dashboard/đăng nhập/push/deploy thay người dùng. [Hướng dẫn Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/).

## Các bước kế tiếp cần duyệt riêng

- **B:** schema D1 SQLite đa Tenant, composite FK, membership/role, Auth JWT/JWKS, test xuyên Tenant, bootstrap Super Admin an toàn. Không dùng PostgreSQL RPC/RLS trên D1.
- **C:** quản trị tenant/cơ cấu/tài khoản/TreeView, invite/reset/revoke qua identity provider.
- **D:** nối UI sang API và triển khai nghiệp vụ thật, R2, import/export.
- **E:** QA, backup/restore D1+R2, Preview, rồi Production khi được duyệt. Các lệnh triển khai trên là hướng dẫn; chưa tự thực hiện thao tác Cloud. A đang chờ nghiệm thu, chưa được tự chuyển B.
