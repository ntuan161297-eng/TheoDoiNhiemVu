# HƯỚNG DẪN ƯU TIÊN TÀI LIỆU HIỆN HÀNH

> **B1.2, 09/11/2026:** D1 TEST `theodoinhiemvu-d1-test` (UUID `649fd0db-7fd3-4551-bfac-f3fccc408373`) đã áp dụng đủ 5 migration. Có 20 bảng ứng dụng, đúng seed 11/3/3; không profile/task/tenant A/B. FK check và quick_check đạt; integrity_check bị D1 từ chối SQLITE_AUTH, không đánh dấu đạt. Chỉ chuẩn bị binding Preview local, chưa push/deploy/Auth/R2. [Báo cáo B1.2 và hướng dẫn Preview](../qa/D1_B1_2.md). Các trạng thái B1/A.2 cũ bên dưới là lịch sử trước B1.2.

> **Cập nhật 09/11/2026:** A/Preview đã nghiệm thu. B1 D1 local đã có 5 migrations/20 bảng và kiểm thử; xem [thiết kế B1](../cloudflare/D1_B1.md). Chưa migration remote hoặc Auth B2/C/D/E; UI tiếp tục DEMO. Yêu cầu B1 trực tiếp mới nhất ưu tiên hơn các đoạn lộ trình A/B lịch sử bên dưới.

Đây là dự án đang có, không phải bộ khởi tạo phần mềm mới. Quyết định mới nhất là tích hợp Cloudflare Workers Static Assets/Worker API + D1/R2 và mở rộng nhiều tenant.

1. [Master Cloudflare nguyên văn](../cloudflare/MASTER_PROMPT.md): kiến trúc, multi-tenant, vai trò, bảo toàn UI và ranh giới A–E.
2. [Kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) và [truy vết yêu cầu](../cloudflare/REQUIREMENTS_TRACEABILITY.md): phân biệt yêu cầu đầy đủ với phần đã được phép/đã làm. A đã nghiệm thu, B1 local đã kiểm thử; B2 chưa triển khai.
3. PRD/UX/rules/tests **V1.3 ưu tiên V1.2** về hạn/hoàn thành/đôn đốc/gia hạn/import/KPI. Phần công nghệ .NET/SQL Server/Supabase database và phạm vi một cơ quan trong tài liệu lịch sử đã được master mới thay thế.
4. `seed/*.csv` và Excel mẫu là chuẩn danh mục/cấu trúc nhập Hương Đô: 11 đơn vị, 3 lãnh đạo, 3 nguồn. Đây không phải giới hạn danh mục của mọi tenant, không phải account hoặc task seed.

Đọc V1.2: `01_MASTER_PRD_MVP.md`, `02_UI_UX_BLUEPRINT.md`, `03_DOMAIN_DATA_AND_RULES.md`, `04_GITHUB_REUSE_AUDIT.md`, `05_ACCEPTANCE_TESTS.md`. Đọc V1.3: `01_PRD_NGHIEP_VU_V13.md`, `02_UI_UX_V13.md`, `03_TEST_NGHIEM_THU_V13.md` và workbook.

Giữ app/component/Design System đang có; không sửa VanPhongSo, mang dữ liệu Hưng Yên/KPI hardcode sang hoặc tự tạo frontend mới. Không tự tạo tài khoản cho 11 đơn vị chỉ từ CSV. Các chức năng Tenant Admin/TreeView/account mới thuộc chặng C được duyệt, không bỏ chúng theo giới hạn màn hình cũ.

D1 dùng SQL SQLite và quyền Worker API/composite FK, không dùng PostgreSQL RLS/RPC hoặc migration Supabase nguyên trạng. Không lưu mật khẩu thủ công; Supabase chỉ được đánh giá làm Auth ở B. Không đổi Vercel Production, chạy migration remote, push/deploy hoặc chuyển chặng ngoài phạm vi cho phép.

Các reference/demo là minh họa, không phải dữ liệu thật. Nguồn ưu tiên không tự thay thế phê duyệt: phê duyệt mới cho B1 local; remote migration và B2/C/D/E chưa được phép tự triển khai.
