# CHẶNG B — D1 MULTI-TENANT, DANH TÍNH VÀ PHÂN QUYỀN

> B1 hiện đã hoàn tất nền D1 local trên feature/d1-multitenant-b1: docs/cloudflare/D1_B1.md. Không tự chạy toàn bộ prompt B này: remote migration và B2 Auth cần phê duyệt riêng. Giữ UI/router A; chưa bootstrap Super Admin hoặc endpoint công khai.

Chỉ triển khai sau khi chủ sản phẩm duyệt A và giao B. Đọc master Cloudflare, kế hoạch, bảng truy vết, PRD/test V1.3 và CSV/Excel. Kiểm tra branch/local/checkpoint; giữ nguyên frontend. Không tự đọc prompt này như phê duyệt B.

Dùng Cloudflare D1 và SQL tương thích SQLite, migration có version riêng tại `cloudflare/d1/migrations`. Không apply `supabase/migrations`, không dùng PostgreSQL RLS/RPC/SECURITY DEFINER, không quay lại .NET/SQL Server. Bước remote apply luôn cần được cho phép riêng; test/seed local phải phân biệt với Cloud.

Thiết kế tenants, organization_units cây, profiles, tenant_memberships, tenant_member_roles, user_unit_assignments, leaders/task_sources và các bảng task/căn cứ/phối hợp/tiến độ/đôn đốc/liên kết/gia hạn/attachments/audit/import_jobs/import_job_rows. Bảng nghiệp vụ có tenant_id, composite FK/index/unique/check chống liên kết chéo tenant. Seed đúng 11/3/3 cho Hương Đô, không nhân sang mọi tenant, không tự nạp task demo hoặc tạo account 11 đơn vị.

Đánh giá Supabase Auth cho identity nếu phù hợp; không tự lưu/hash/password/reset token. Backend Worker API xác minh JWT và membership/role từ D1, không tin metadata/role DEMO/tenant header. Mỗi API đọc/ghi/report/export/file đều kiểm tra danh tính, active membership, tenant cấp quyền, action role, record scope; thay đổi đặc quyền có audit. Một account nhiều tenant phải chuyển context rõ và không giữ cache của tenant cũ.

Super Admin chỉ quản trị nền tảng/tenant/Tenant Admin, không mặc định xem nhiệm vụ tenant. Tenant Admin chỉ quản trị cơ cấu/tài khoản được phép trong tenant. Editor ghi; Confirmer xác nhận/kết quả gia hạn; Viewer đọc. Chốt capability và việc có nhiều role, không sao chép ma trận ADMIN đơn cơ quan cũ để mở quyền. Bootstrap Super Admin theo runbook kiểm soát, có audit, không user đầu tiên tự thành admin hoặc credential seed vào repo.

Chuẩn bị transaction/batch, optimistic concurrency, idempotency, append-only audit và bất biến hạn/snapshot trong backend/DB; kiểm thử rollback khi thất bại, không chỉ kiểm tra trước trên frontend. Contract R2 private, metadata D1 và server-only secrets/bindings; chưa tự làm toàn bộ nghiệp vụ/TreeView/invite UI của C/D.

Test được phép và bị chặn giữa tenant A/B: đổi tenant/task/document/file/unit ID, membership khóa/thu hồi, vai trò thiếu, giả metadata, tự cấp quyền, Super Admin đọc task nội bộ không membership, cross-tenant FK, bộ lọc/report/export. Báo nguồn test data/local-vs-remote, kết quả đã chạy và còn thiếu. Không tuyên bố bảo mật đạt bằng SQL schema hoặc nút ẩn. Dừng chờ duyệt trước C; không deploy Production, đổi Vercel hoặc chạy migration remote ngoài phạm vi duyệt.
