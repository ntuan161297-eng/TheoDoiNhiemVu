# BẮT ĐẦU TỪ DỰ ÁN HIỆN CÓ — CLOUDFLARE WORKERS STATIC ASSETS

> **B1.2, 09/11/2026:** D1 TEST `theodoinhiemvu-d1-test` (UUID `649fd0db-7fd3-4551-bfac-f3fccc408373`) đã áp dụng đủ 5 migration. Có 20 bảng ứng dụng, đúng seed 11/3/3; không profile/task/tenant A/B. FK check và quick_check đạt; integrity_check bị D1 từ chối SQLITE_AUTH, không đánh dấu đạt. Chỉ chuẩn bị binding Preview local, chưa push/deploy/Auth/R2. [Báo cáo B1.2 và hướng dẫn Preview](docs/qa/D1_B1_2.md). Các trạng thái B1/A.2 cũ bên dưới là lịch sử trước B1.2.

Mở workspace `D:\ubnd-huong-do-tasks`. Không giải nén tạo dự án mới, không ghi đè hoặc sửa repository tham khảo VanPhongSo.

1. Đọc [master Cloudflare đã hợp nhất](docs/cloudflare/MASTER_PROMPT.md).
2. Đọc [kế hoạch hiện hành](docs/IMPLEMENTATION_PLAN.md) và [bảng đối chiếu yêu cầu/tiến độ](docs/cloudflare/REQUIREMENTS_TRACEABILITY.md).
3. Nghiệp vụ theo [hướng dẫn ưu tiên](docs/product/00_DOC_TRUOC.md), PRD/UX/test V1.3 và CSV/Excel trong docs/product. Các công nghệ backend cũ trong PRD lịch sử đã được thay bằng Cloudflare.
4. Chặng A/Preview đã nghiệm thu; mở http://127.0.0.1:8788/ và http://127.0.0.1:8788/api/health. Nếu chưa chạy server: `npm run dev:worker`. Xem [hướng dẫn chi tiết](docs/cloudflare/README.md).
5. B1 D1 local: [hướng dẫn](docs/cloudflare/D1_B1.md), [báo cáo](docs/qa/D1_B1.md). Phần mềm vẫn login/nghiệp vụ DEMO; dữ liệu trong bộ nhớ, không phải D1/Auth/R2 thật. Không dùng cho văn bản nội bộ hoặc công việc chính thức.

## Dùng đúng prompt cho đúng chặng

| Prompt | Phạm vi |
|---|---|
| `00_PHAN_TICH_TRUOC_KHI_CODE.md` | Phân tích tác động trên dự án hiện có |
| `01_DUNG_GIAO_DIEN_MAU.md` | Bảo toàn và kiểm tra UI đang có |
| `01A_CLOUDFLARE_WORKERS_HA_TANG.md` | A — Workers Static Assets/Worker API, health, chạy chung local |
| `02_TAO_DATABASE_API_DANG_NHAP.md` | B — D1 multi-tenant, identity, membership/role |
| `02C_QUAN_TRI_TENANT.md` | C — Tenant TreeView, cơ cấu, quản trị tài khoản |
| `03_IMPORT_DON_DOC_GIA_HAN.md` | D — API nghiệp vụ thật, file, import/export |
| `04_KIEM_THU_NGHIEM_THU.md` | E — QA, restore, Preview, Production có duyệt |

Các prompt nằm trong `prompts/`, không phải lệnh tự động chạy tất cả. **A đã nghiệm thu; B1 migrations/D1 local đã được duyệt và kiểm thử. Remote migration, B2 Auth và C–E vẫn cần phê duyệt riêng.**

Không cài phần mềm hệ thống, thay Windows, chạy migration remote, xóa dữ liệu, push hoặc deploy khi chưa có yêu cầu tương ứng. Không đổi Vercel Production. Mỗi lần tiếp tục cần kiểm tra Git/local trước và giữ các thay đổi chưa push.

Kiến trúc đích: React/Vite/Ant Design/Recharts → Worker API `/api` → D1/R2 private; Supabase chỉ được đánh giá cho Auth, không lưu mật khẩu thủ công. D1 không dùng PostgreSQL RLS/RPC/migration. Super Admin không có mặc định quyền đọc nhiệm vụ tenant.

Các hướng dẫn cũ đã lưu tại [snapshot](docs/archive/2026-11-06-before-master-sync/README.md); không dùng để quay lại quy trình .NET/SQL Server hoặc Supabase database.
