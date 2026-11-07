# PHÂN TÍCH TRƯỚC KHI THAY ĐỔI — DỰ ÁN CLOUDFLARE HIỆN CÓ

Chỉ phân tích trong lượt dùng prompt này; không tự viết code/cài công cụ/ghi file/commit/push/deploy nếu yêu cầu thực tế chưa cho phép.

Đọc `docs/cloudflare/MASTER_PROMPT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/cloudflare/REQUIREMENTS_TRACEABILITY.md`, toàn bộ PRD/UX/rules/test V1.3, CSV và Excel. Quyết định Cloudflare/multi-tenant mới nhất ưu tiên phần công nghệ/phân quyền cũ; V1.3 ưu tiên V1.2 về nghiệp vụ.

Đây là tích hợp vào workspace hiện có, không tạo frontend/repository mới. Kiểm tra local/GitHub, ưu tiên local chưa push; đề xuất branch/checkpoint trước khi thay đổi. Giữ Design System, login, Dashboard, bảng/filter, form, Drawer/import, lịch/giờ Việt Nam và TreeView nếu đã có. Không sửa VanPhongSo, không thay Vercel Production.

Kiến trúc đích: React/TypeScript/Vite/Ant Design/Recharts; Cloudflare Workers Static Assets + Worker API; D1 SQLite; R2 private; Supabase Auth chỉ nếu được đánh giá phù hợp. Không tự lưu mật khẩu. Không dùng PostgreSQL RLS/RPC/migration ở D1. Frontend chỉ gọi `src/services/api.ts` → `/api`, không truy cập binding.

Phân tích đầy đủ tenant/cơ cấu/profiles/memberships/roles/unit assignments; composite FK; Super Admin không mặc định đọc nghiệp vụ tenant; Tenant Admin quản trị cơ cấu/tài khoản/invite/reset/revoke; Editor/Confirmer/Viewer đúng quyền. Mọi API kiểm tra danh tính, membership, tenant, capability, record scope và audit thay đổi đặc quyền.

Trả tiếng Việt: hiện trạng thực có; phần được giữ lại; khoảng thiếu so với từng mục master; kiến trúc/ERD/ma trận quyền đề xuất; hạn/KPI/đôn đốc/gia hạn/import giữ V1.3; kế hoạch A–E và tiêu chí nghiệm thu; tối đa 5 quyết định còn thật sự chưa rõ. Phân biệt có code/chỉ kế hoạch/chưa được phép. Không hỏi lại nội dung master đã ghi.

Hiện Chặng A đã kiểm tra local và chờ nghiệm thu; prompt phân tích không tự cấp quyền bắt đầu B. Chỉ lưu tài liệu khi người dùng cho phép. Kết thúc bằng trạng thái chờ duyệt tương ứng, không tuyên bố đã hoàn thành hệ thống thật.
