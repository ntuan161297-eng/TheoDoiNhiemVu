# BƯỚC 2.2 — BÁO CÁO MIGRATION SUPABASE VÀ KIỂM THỬ TĨNH

Ngày 05/11/2026. Kiến trúc đã được chủ sản phẩm duyệt; được phép tạo SQL và kiểm thử tĩnh. **Chưa được phép chạy migration trên Cloud, tạo Admin hoặc triển khai ứng dụng.**

## Bàn giao

- `supabase/config.toml`, `supabase/.gitignore`: cấu trúc project local, không linked, không có secret; private không expose, không auto seed, không sign-up/anonymous trong config local. Không tự đổi cài đặt Cloud.
- Sáu file `supabase/migrations/20261105090000` đến `20261105090500`: identity/danh mục, schema, invariant/audit, transaction, read models/Storage, seed chính thức.
- 17 bảng (16 public, 1 private), 41 FK, PK/unique/check/index; Auth dùng auth.users có sẵn, không tự tạo password table. File READY thêm verified_at/by để khóa đường hoàn tất file chưa xác minh server.
- 38 functions, một view SECURITY INVOKER. Mọi DEFINER ở private có search_path rỗng và owner NOLOGIN hạn chế. Public write RPC là INVOKER; backend phân biệt bốn role bằng membership trong DB. Cột hạn/kết quả/role không ghi trực tiếp qua REST; audit và tiến độ append-only.
- `supabase/tests/001_security_and_business.sql`: các ca được phép/bị chặn cho bốn role và trạng thái chưa có quyền/đã khóa/anonymous; CRUD/tiến độ/hoàn thành/snapshot/KPI/ngày/idempotency/version.
- `supabase/tests/002_deferred_and_future_transactions.sql`: schema/constraint, rollback khi file không hợp lệ, pending/approve/reject tuần tự, đôn đốc chung/hủy, snapshot bất biến; dùng role executor từ owner runner để kiểm tra thân hàm GĐ3 mà không mở API cho client.
- Hai script read-only `supabase/verification/preflight.sql`, `post_migration.sql` để dùng sau khi được phép kết nối.
- `scripts/check-supabase-sql.mjs`, npm script `check:sql`, dev dependency `libpg-query@18.2.2` và lockfile. Không cài Supabase CLI/system software; chưa cần Supabase JS vì bước này chưa nối React.
- Hướng dẫn kết nối/apply trong [supabase/README.md](../../supabase/README.md). Cập nhật trạng thái kiến trúc và kế hoạch, giữ tài liệu môi trường cũ làm lịch sử.

## Kết quả đã thực hiện local

1. `npm run check:sql`: phân tích cú pháp PostgreSQL SQL/PLpgSQL, DO và SQL trong các case từ chối; kiểm tra quan hệ FK đích/cột, PK/RLS/policy, grant client, không DEFINER exposed, seed khớp CSV từng trường. Chi tiết và SHA-256 từng file ở [STAGE2_MIGRATION_STATIC.json](STAGE2_MIGRATION_STATIC.json); file này được tái tạo khi chạy kiểm tra, không chứa credential.
2. Seed VALUES: đúng 11 đơn vị, 3 nguồn, 3 lãnh đạo; UUID/code ổn định, không tự sửa tên/chức danh. Không INSERT auth.users/profiles/user_roles/tasks trong seed. Catalog seed được audit; không tạo nhiệm vụ hay user giả lập trên database.
3. Rà soát tĩnh: tất cả bảng exposed có RLS, anonymous không có table/RPC grant nghiệp vụ; client chỉ SELECT và RPC được cấp. Hàm quyết định gia hạn kiểm tra confirmer; hàm GĐ3 không cấp authenticated EXECUTE hoặc public wrapper. Storage không có client write policy, không ghi đè file ready, fail để review nếu có bucket/policy cũ.
4. Đã bổ sung kiểm tra AST cấm BEGIN/COMMIT top-level trong migration: dùng transaction của Supabase runner để không làm lệch migration history. Trigger deferred đối chiếu hạn hiệu lực và chứng cứ ở transaction boundary. [Nguồn Supabase](https://supabase.com/kb/troubleshooting/partial-migrations-and-schema-inconsistencies-from-embedded-transactions-13ae82).
5. `npm run build`: thành công. Vite còn cảnh báo bundle lớn hơn 500 kB; không có lỗi chặn. Không sửa mã frontend/theme/layout/component hay bật Auth/database mode.

## Giới hạn kết quả và điều kiện duyệt apply

**Đây là kiểm thử tĩnh, không phải kết quả chạy database.** Parser WebAssembly dùng grammar PostgreSQL 18; source dùng tính năng tương thích PostgreSQL 17. Chưa compile/resolve toàn bộ type/function/column theo catalog Supabase thực, chưa chạy fixtures SQL, chưa kiểm tra quyền thực tế qua JWT/REST hoặc transaction hai phiên. Báo cáo không khẳng định RLS/runtime đã đạt nghiệm thu.

Không thực thi SQL trên local database/embedded database/Cloud. Không đăng nhập, link project, dry-run Cloud, tạo bucket/account thật, bootstrap Admin, đưa văn bản/dữ liệu nội bộ lên Cloud, deploy, commit hoặc push. Thư viện parser chỉ dev dependency trong workspace; không thay cấu hình Windows.

Trước khi chạy migration cần PO xác nhận project thử nghiệm riêng và phê duyệt apply; sau đó kiểm tra preflight/phiên bản DB/quyền role/schema exposure, review sáu migration và dry-run, rồi mới apply có migration history. Không tạo bucket thủ công trước vì migration đã quản lý bucket. Bootstrap Admin, kết nối Auth/CRUD và frontend thuộc bước sau, không tự chuyển tiếp.

Phần GĐ3 còn khóa: chưa import thật, chưa cấp public đôn đốc/gia hạn, chưa có luồng đính chính/hủy quyết định đã áp dụng; server verification/upload/signed URL cũng chưa triển khai. Các cấu trúc/hàm đã chuẩn bị không phải tuyên bố hoàn tất những chức năng đó.

**CHỜ CHỦ SẢN PHẨM DUYỆT CHẠY MIGRATION.**
