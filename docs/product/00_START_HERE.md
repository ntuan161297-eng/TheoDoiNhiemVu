# BẮT ĐẦU Ở ĐÂY — DỰ ÁN CLOUDFLARE HIỆN CÓ

> **B1.2, 09/11/2026:** D1 TEST `theodoinhiemvu-d1-test` (UUID `649fd0db-7fd3-4551-bfac-f3fccc408373`) đã áp dụng đủ 5 migration. Có 20 bảng ứng dụng, đúng seed 11/3/3; không profile/task/tenant A/B. FK check và quick_check đạt; integrity_check bị D1 từ chối SQLITE_AUTH, không đánh dấu đạt. Chỉ chuẩn bị binding Preview local, chưa push/deploy/Auth/R2. [Báo cáo B1.2 và hướng dẫn Preview](../qa/D1_B1_2.md). Các trạng thái B1/A.2 cũ bên dưới là lịch sử trước B1.2.

> **Cập nhật 09/11/2026:** A/Preview đã nghiệm thu. B1 D1 local đã có 5 migrations/20 bảng và kiểm thử; xem [thiết kế B1](../cloudflare/D1_B1.md). Chưa migration remote hoặc Auth B2/C/D/E; UI tiếp tục DEMO. Yêu cầu B1 trực tiếp mới nhất ưu tiên hơn các đoạn lộ trình A/B lịch sử bên dưới.

Mục tiêu: theo dõi/đôn đốc nhiệm vụ cho Hương Đô trước, mở rộng nhiều cơ quan với dữ liệu và quyền riêng. Giữ sản phẩm/UI đang có, tích hợp từng bước; không tạo lại dự án.

Đọc [hướng dẫn ưu tiên](00_DOC_TRUOC.md), [master đầy đủ](../cloudflare/MASTER_PROMPT.md), [kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) và [bảng truy vết](../cloudflare/REQUIREMENTS_TRACEABILITY.md).

## Chạy và kiểm tra hiện tại

Trong `D:\ubnd-huong-do-tasks`, chạy `npm run dev:worker`, mở http://127.0.0.1:8788/ và /api/health. Login/nghiệp vụ vẫn DEMO; A có Worker API hạ tầng, chưa có D1/Auth/R2/quyền đa tenant thật. Xem [hướng dẫn local/Cloudflare](../cloudflare/README.md) và [báo cáo A](../qa/CLOUDFLARE_WORKERS_STAGE_A.md).

## Tiếp tục theo chặng

- A: kiểm tra local/GitHub, branch/backup/checkpoint, Workers Static Assets/Worker API/service/health, giữ UI.
- B: sau duyệt A, D1 multi-tenant, SQLite migrations/seed Hương Đô, identity/Auth và permission tests A/B, Super Admin bootstrap an toàn.
- C: tenant/cơ cấu TreeView/tài khoản/invite/reset/revoke/audit quản trị.
- D: CRUD/tiến độ/hoàn thành/KPI/report/đôn đốc/gia hạn/import/export/file R2 thật.
- E: QA, xuyên tenant, backup/restore D1+R2, Preview, Production sau duyệt riêng.

Các prompt đúng tên ở thư mục [prompts](../../prompts/); bản đồ chi tiết trong [README bắt đầu](../../README_BAT_DAU.md). Không sử dụng các tên PROMPT_00/PROMPT_02 cũ không tồn tại trong repo. Không tự chạy toàn bộ lộ trình sau khi đọc master.

## Nghiệp vụ nền tiếp tục áp dụng

Một task một nguồn/chủ trì, nhiều phối hợp, lãnh đạo và hạn gốc; hạn gốc bất biến, approved mới đổi hạn hiệu lực; cảnh báo ngày lịch Việt Nam; xác nhận hoàn thành có kết quả/ngày thực tế/actor/snapshot; KPI không đếm trùng và report theo chủ trì. V1.3 ưu tiên V1.2.

Seed 11/3/3 chỉ dành cho Hương Đô; các đơn vị thực hiện không tự có account từ danh mục. Tenant Admin quản lý user/membership theo phạm vi được cấp ở C. Không đưa task/văn bản nội bộ lên site demo. Lịch sử backend cũ được giữ để tham khảo, không là chỉ dẫn cài .NET/SQL Server hay apply PostgreSQL vào D1.
