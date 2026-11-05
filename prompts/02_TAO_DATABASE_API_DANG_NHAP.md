# GIAI ĐOẠN 2 — SUPABASE POSTGRESQL, AUTH, STORAGE VÀ RLS

Quyết định công nghệ cập nhật ngày 05/11/2026: dùng Supabase, giữ nguyên frontend React/TypeScript/Vite/Ant Design/Recharts. Không tạo frontend mới, không cài .NET SDK/SQL Server. Đọc toàn bộ `docs/product`, ưu tiên V1.3 khi mâu thuẫn; kế hoạch hiện hành ở `docs/IMPLEMENTATION_PLAN.md` và `docs/analysis/STAGE2_SUPABASE_ARCHITECTURE.md`.

**Phê duyệt mới nhất: Bước 2.2 chỉ tạo file migration và kiểm thử tĩnh.** Kiến trúc đã duyệt; được tạo `supabase/migrations`, seed danh mục, SQL tests, cấu hình project local và công cụ phát triển trong project. Không chạy SQL trên bất kỳ database nào, link Supabase Cloud, tạo Admin thật, nối Auth/CRUD/Dashboard vào frontend hoặc deploy. Xem `supabase/README.md` và `docs/qa/STAGE2_MIGRATION_REVIEW.md`; hoàn tất thì dừng chờ phê duyệt chạy migration. Không tự thực hiện toàn bộ GĐ2 một lần.

**Sau khi được duyệt bước triển khai:** Supabase PostgreSQL, Auth, Storage private, RLS + grants; transaction nghiệp vụ bằng RPC, Edge Functions khi cần server. Migration SQL có version trong `supabase/migrations`. Chỉ seed 11 đơn vị/3 lãnh đạo/3 nguồn chính thức từ CSV, không nhiệm vụ DEMO, tài khoản/mật khẩu hay văn bản nội bộ.

Vai trò ADMIN/OFFICE_EDITOR/OFFICE_CONFIRMER/LEADER_VIEWER theo ma trận đã duyệt. Không tự nâng quyền, không tin user_metadata hoặc role DEMO. Mọi bảng/API/RPC/Storage kiểm tra quyền tại backend/database; audit append-only. CRUD nhiệm vụ/căn cứ/phối hợp, tiến độ, xác nhận hoàn thành, attachment, lọc/KPI và 11 đơn vị thuộc GĐ2. Chuẩn bị schema đôn đốc/gia hạn/import nhưng chưa triển khai nghiệp vụ GĐ3.

React dùng `@supabase/supabase-js` qua lớp service và generated types/DTO adapter. Hai biến `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Không commit `.env.local`, không đưa secret/service_role/password/access token vào trình duyệt. Không fallback mock khi truy vấn thật lỗi; giữ UI và chế độ DEMO riêng rõ ràng.

Bắt buộc giữ hạn gốc bất biến, hạn hiệu lực chỉ đổi sau chấp thuận, snapshot khi hoàn thành, ngày nghiệp vụ Asia/Ho_Chi_Minh, cảnh báo 3–5/0–2/<0, thống kê mỗi task một lần theo chủ trì. Ghi liên bảng phải nguyên tử, audit + concurrency + chống retry trùng. Kiểm thử quyền bằng JWT từng role thay vì chỉ SQL Editor quyền owner.

Môi trường Cloud thử nghiệm; không đưa văn bản thật/dữ liệu nội bộ lên Cloud, không tự deploy/công khai/push. Sau từng bước được duyệt, báo file thay đổi, kết quả kiểm thử và hướng dẫn chạy; dừng trước GĐ3.
