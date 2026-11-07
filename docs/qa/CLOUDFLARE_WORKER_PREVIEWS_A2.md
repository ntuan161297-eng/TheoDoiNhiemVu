# Chặng A.2 — Chuẩn bị Worker Previews và điều kiện phát hành

Ngày 07/11/2026. Nhánh **feature/cloudflare-worker-stage-a**, origin `https://github.com/ntuan161297-eng/TheoDoiNhiemVu.git`. Commit bàn giao được ghi trong kết quả Git/final; tài liệu này không tự nhúng hash của chính commit chứa nó.

## Bảo toàn

Backup trước sửa A.2: `backups/before-worker-previews-a2-20261107-070640.zip`, 183 file, kiểm tra CRC đạt. SHA256 `1ca141b036501d1bb02ae7b2d1a0feef0a91d83088cfd7d6da2d90514d25c5ad`. HEAD ban đầu `2e17c3c182f0ad1f3037c454600697ac3768ad7b`; bảo toàn các thay đổi Chặng A và tài liệu chưa commit. Không reset/rewrite UI hoặc nghiệp vụ DEMO.

## Kết quả kiểm tra Cloudflare

- Wrangler project **4.157.0**, `preview --help` hỗ trợ Worker Previews; tính năng yêu cầu >=4.135.0.
- `wrangler whoami`: **You are not authenticated**. Không có công cụ Cloudflare Dashboard kết nối để đọc Builds.
- Chưa xác nhận repo/Production branch/Preview Builds/Preview command hoặc Previews Base trong account thực tế. Đã yêu cầu người dùng cung cấp xác nhận, không coi cấu hình local là bằng chứng Dashboard.
- Vì điều kiện trước push chưa được xác minh, **chưa push hoặc gọi deploy Preview**, không thay bằng `versions upload`, deploy Worker riêng, temporary account hoặc deploy Production.
- **URL Preview thực tế: chưa có. Test frontend/API trên Cloud Preview: chưa chạy.** Không dùng kết quả local để đánh dấu Preview đạt.

## Cấu hình đã chuẩn bị local

`wrangler.jsonc` giữ Worker name `theodoinhiemvu`, entry/static assets/SPA/Worker-first. Thay `env.preview`/`preview_urls` bằng `previews` thật: vars APP_ENV=preview và D1/R2 rỗng. Không secret/resource thật. `preview:worker` gọi `wrangler preview --ignore-base-config`; chưa thực hiện deploy.

`scripts/check-worker-preview.mjs` dùng parser Wrangler kiểm tra offline; đã đạt. `build:worker` chỉ bundle local bằng **deploy --name theodoinhiemvu-build-check --dry-run**; không upload, không nhắm Worker Production. `playwright.preview.config.ts`/`test:ui:preview` chuẩn bị kiểm thử URL Preview thực tế, từ chối hostname Production và không dùng local server.

## Kiểm thử lại và rà soát commit

| Kiểm tra local ngày 07/11/2026 | Kết quả |
|---|---|
| npm run check:preview | Đạt, dùng parser Wrangler; không kiểm tra Dashboard |
| npm run build | Đạt, TypeScript + Vite; hash JS/CSS UI giữ nguyên |
| npm run build:worker | Đạt, dry-run local, không upload |
| npm run test | 28/28 đạt |
| npm run test:ui:worker | 9/9 đạt, 49,2 giây, workerd thật |
| Test trên URL Preview | Chưa chạy, chưa có URL thực tế |
| So hash với backup A.2 | 24 file src/Worker entry/package-lock/Vite/Vercel giữ nguyên |
| Rà soát staged | 68 file; không file môi trường; không phát hiện mẫu private key, GitHub/AWS/Supabase token hoặc JWT đã kiểm tra |

Rà soát secrets là kiểm tra theo mẫu, không thay việc kiểm tra account/Builds/secrets trên Cloudflare. Có snapshot Markdown lịch sử giữ nguyên hai dấu cách xuống dòng; không sửa bản lưu chỉ để bỏ cảnh báo whitespace. Code/tài liệu active kiểm tra whitespace riêng. Còn cảnh báo bundle Vite lớn >500 kB từ trước, không chặn build. Bằng chứng local tại `.local/cloudflare/a2-precommit-checks.json`, `.local/cloudflare/worker-qa` và log build/test; không commit file local hoặc credentials.

## Bước tiếp theo do người dùng thực hiện

Theo [hướng dẫn Dashboard đầy đủ](../cloudflare/WORKER_PREVIEWS_A2.md): Workers & Pages → theodoinhiemvu → Settings → Builds; repo TheoDoiNhiemVu, root repo, main là Production, bật Preview Builds, build **npm run build**, Preview command **npx wrangler preview --ignore-base-config**; không tài nguyên/secret Production. Nếu còn Set up Worker Previews, xem và thực hiện chuyển mô hình một lần nếu đồng ý.

Chỉ khi xác nhận an toàn mới push nhánh feature, lấy URL từ log/Dashboard và kiểm thử thực tế. Nếu dùng CLI còn cần người dùng đăng nhập đúng account. Không sửa Production deploy command/traffic, không push main; không D1 migration, R2, Auth thật hoặc Chặng B.
