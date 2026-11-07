# HƯỚNG DẪN ƯU TIÊN TÀI LIỆU HIỆN HÀNH

Đây là dự án đang có, không phải bộ khởi tạo phần mềm mới. Quyết định mới nhất là tích hợp Cloudflare Workers Static Assets/Worker API + D1/R2 và mở rộng nhiều tenant.

1. [Master Cloudflare nguyên văn](../cloudflare/MASTER_PROMPT.md): kiến trúc, multi-tenant, vai trò, bảo toàn UI và ranh giới A–E.
2. [Kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) và [truy vết yêu cầu](../cloudflare/REQUIREMENTS_TRACEABILITY.md): phân biệt yêu cầu đầy đủ với phần đã được phép/đã làm. Hiện A kiểm tra local, B chưa triển khai.
3. PRD/UX/rules/tests **V1.3 ưu tiên V1.2** về hạn/hoàn thành/đôn đốc/gia hạn/import/KPI. Phần công nghệ .NET/SQL Server/Supabase database và phạm vi một cơ quan trong tài liệu lịch sử đã được master mới thay thế.
4. `seed/*.csv` và Excel mẫu là chuẩn danh mục/cấu trúc nhập Hương Đô: 11 đơn vị, 3 lãnh đạo, 3 nguồn. Đây không phải giới hạn danh mục của mọi tenant, không phải account hoặc task seed.

Đọc V1.2: `01_MASTER_PRD_MVP.md`, `02_UI_UX_BLUEPRINT.md`, `03_DOMAIN_DATA_AND_RULES.md`, `04_GITHUB_REUSE_AUDIT.md`, `05_ACCEPTANCE_TESTS.md`. Đọc V1.3: `01_PRD_NGHIEP_VU_V13.md`, `02_UI_UX_V13.md`, `03_TEST_NGHIEM_THU_V13.md` và workbook.

Giữ app/component/Design System đang có; không sửa VanPhongSo, mang dữ liệu Hưng Yên/KPI hardcode sang hoặc tự tạo frontend mới. Không tự tạo tài khoản cho 11 đơn vị chỉ từ CSV. Các chức năng Tenant Admin/TreeView/account mới thuộc chặng C được duyệt, không bỏ chúng theo giới hạn màn hình cũ.

D1 dùng SQL SQLite và quyền Worker API/composite FK, không dùng PostgreSQL RLS/RPC hoặc migration Supabase nguyên trạng. Không lưu mật khẩu thủ công; Supabase chỉ được đánh giá làm Auth ở B. Không đổi Vercel Production, chạy migration remote, push/deploy hoặc chuyển chặng ngoài phạm vi cho phép.

Các reference/demo là minh họa, không phải dữ liệu thật. Nguồn ưu tiên không tự thay thế phê duyệt: mục 10 master hiện chỉ cho A, B cần nghiệm thu/phê duyệt A trước.
