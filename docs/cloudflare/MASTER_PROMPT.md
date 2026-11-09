# MASTER PROMPT — TÍCH HỢP CLOUDFLARE WORKERS STATIC ASSETS FULL-STACK VÀO PHẦN MỀM HIỆN TẠI

> **Phê duyệt mới 09/11/2026:** A/Preview đã nghiệm thu; B1 migration/D1 local được phép và đã kiểm thử, xem [B1](D1_B1.md). B2/Auth, C/D/E, push/deploy và remote migration chưa được phép tự thực hiện. Mục 10 bên dưới giữ nguyên yêu cầu lịch sử A, không phải ranh giới hiện hành B1.

> **Bản hợp nhất ngày 06/11/2026:** [yêu cầu Chặng A mới nhất](STAGE_A_WORKERS_REQUEST.md) thay kiến trúc Pages/Functions bằng Workers Static Assets + Worker API, giữ nguyên yêu cầu đa tenant/nghiệp vụ và lộ trình A–E. [Master gốc nguyên văn](../archive/2026-11-06-before-workers/docs/cloudflare/MASTER_PROMPT.md) được bảo toàn để đối chiếu. Chỉ local Chặng A được phép; Preview và B phải chờ nghiệm thu.

## 1. Bối cảnh

Tôi đang phát triển phần mềm Theo dõi và Đôn đốc nhiệm vụ, ban đầu triển khai cho UBND xã Hương Đô, sau đó mở rộng cho nhiều xã, phường và cơ quan.

Repository hiện có:

https://github.com/ntuan161297-eng/TheoDoiNhiemVu

Website đang có trên Vercel:

https://theo-doi-nhiem-vu.vercel.app/

Tôi quyết định chuyển sang kiến trúc Cloudflare Workers Static Assets cho frontend và Cloudflare Worker API cho backend API.

Ưu tiên phương án:
- React + TypeScript + Vite + Ant Design.
- Cloudflare Workers Static Assets.
- Cloudflare Worker API.
- Cloudflare D1 làm database nghiệp vụ.
- Cloudflare R2 làm kho tài liệu riêng tư.
- Supabase Auth tạm thời làm dịch vụ danh tính nếu đây là lựa chọn an toàn và ít phát sinh nhất.

Không tự phát triển hệ thống mật khẩu thủ công hoặc tự lưu mật khẩu.

## 2. Nguyên tắc quan trọng

Đây là yêu cầu TÍCH HỢP VÀO DỰ ÁN HIỆN CÓ, không phải tạo phần mềm mới.

Trước tiên:
- Kiểm tra thư mục dự án local mới nhất.
- So sánh với repository GitHub.
- Ưu tiên các thay đổi đã hoàn thiện ở local nhưng chưa push.
- Tạo Git branch riêng và checkpoint an toàn.
- Không ghi đè hoặc xóa các chức năng đã có.
- Không thay đổi Production Vercel.
- Không chạy lệnh xóa dữ liệu, migration remote hoặc deploy Production khi chưa được phê duyệt.

Giữ nguyên Design System, giao diện đăng nhập, Dashboard, bảng nhiệm vụ, các biểu mẫu, Drawer, TreeView nếu đã có và chức năng lịch ngày tháng.

## 3. Kiến trúc dự án

Frontend:
- Tiếp tục sử dụng các component React hiện có.
- Tạo lớp `src/services/api.ts` để gọi các endpoint `/api`.
- Dần thay DemoProvider bằng dữ liệu API thật.
- Không cho frontend truy cập trực tiếp vào Cloudflare D1 hoặc R2 binding.

Backend:
- Sử dụng Cloudflare Worker API.
- Tạo Worker entry point `worker/index.ts` và module dùng chung trong `server`.
- Xây middleware xác thực và phân quyền.
- Chia API thành các module độc lập theo nghiệp vụ.
- Dùng TypeScript và thư viện tương thích Workers Runtime.

Database:
- Cloudflare D1, sử dụng SQL tương thích SQLite.
- Tạo migration có quản lý phiên bản.
- Không sử dụng trực tiếp cú pháp PostgreSQL hoặc migration Supabase chưa chuyển đổi.
- Thiết kế transaction/batch an toàn cho nghiệp vụ thay đổi nhiều bảng.

Storage:
- Cloudflare R2.
- Bucket private.
- Metadata file lưu trong D1.
- Người dùng phải được kiểm tra quyền trước khi tải file.
- Không trả đường dẫn public cho tài liệu nội bộ.

## 4. Multi-Tenant

Xây dựng nền tảng nhiều cơ quan:

Hệ thống
- UBND xã Hương Đô
- UBND xã A
- UBND xã B

Mỗi cơ quan là một Tenant.

Mỗi Tenant có:
- Cơ cấu tổ chức.
- Danh mục đơn vị.
- Danh mục lãnh đạo.
- Tài khoản và quyền.
- Nhiệm vụ và văn bản.
- Báo cáo và file riêng.

Các bảng nghiệp vụ phải gắn tenant_id.

Có bảng quản lý:
- tenants
- organization_units
- profiles
- tenant_memberships
- tenant_member_roles
- user_unit_assignments
- tasks
- source_documents
- task_progress_updates
- expedite_documents
- expedite_document_tasks
- extension_requests
- attachments
- audit_logs
- import_jobs
- import_job_rows

Sử dụng Composite Foreign Keys, indexes, constraints và kiểm tra quyền tại Worker API để chống truy cập xuyên Tenant.

Cloudflare D1 không có PostgreSQL RLS. Vì vậy không được giả định rằng các chính sách Supabase RLS sẽ hoạt động ở D1.

Mọi API đọc, ghi, thống kê, xuất báo cáo và tải tài liệu phải xác minh:
1. Người dùng đã đăng nhập hợp lệ.
2. Membership của người dùng còn hiệu lực.
3. Tenant được truy cập là Tenant đã cấp quyền.
4. Vai trò có quyền thực hiện hành động.
5. Bản ghi thuộc đúng Tenant.
6. Mọi thay đổi đặc quyền được ghi audit.

## 5. Quản trị hệ thống

Super Admin:
- Tạo và quản lý Tenant.
- Tạo tài khoản Tenant Admin.
- Theo dõi tình trạng Tenant.
- Quản lý cấu hình nền tảng.
- Không mặc định truy cập nhiệm vụ nội bộ của Tenant.

Tenant Admin:
- Quản lý cơ cấu tổ chức TreeView.
- Thêm/sửa/ngừng hoạt động đơn vị.
- Tạo tài khoản.
- Gửi lời mời kích hoạt.
- Cấp/thu hồi quyền.
- Khóa quyền truy cập Tenant.
- Gửi yêu cầu đặt lại mật khẩu.
- Xem nhật ký quản trị trong phạm vi được phép.

Office Editor:
- Thêm/sửa nhiệm vụ.
- Cập nhật tiến độ.
- Ghi nhận đôn đốc và đề nghị gia hạn.

Office Confirmer:
- Xác nhận hoàn thành.
- Ghi nhận kết quả gia hạn đã được cấp có thẩm quyền chấp thuận.

Leader Viewer:
- Xem Dashboard, nhiệm vụ, báo cáo và tài liệu theo quyền.

Một tài khoản có thể thuộc nhiều Tenant nhưng phải chuyển ngữ cảnh rõ ràng và không được lẫn dữ liệu.

## 6. Bảo toàn toàn bộ nghiệp vụ

Đọc kỹ PRD và tài liệu V1.3.

Giữ nguyên:
- Ba nguồn nhiệm vụ.
- Đơn vị chủ trì và nhiều đơn vị phối hợp.
- Lãnh đạo chỉ đạo.
- Hạn gốc bất biến.
- Hạn hiệu lực dựa trên quyết định gia hạn hợp lệ.
- Cảnh báo nguy cơ 3–5 ngày.
- Cảnh báo khẩn 0–2 ngày.
- Quá hạn khi số ngày còn nhỏ hơn 0.
- Phân biệt trạng thái thực hiện, trạng thái thời hạn và trạng thái gia hạn.
- Đôn đốc bằng văn bản.
- Một văn bản đôn đốc liên kết nhiều nhiệm vụ.
- Gia hạn đang chờ không làm đổi hạn hiệu lực.
- Hoàn thành cần ngày thực tế, kết quả và quyền xác nhận.
- Snapshot hạn tại thời điểm hoàn thành.
- Không đếm trùng KPI.
- Import Excel có xem trước, kiểm tra lỗi và xử lý trùng.
- Nhật ký thao tác.

Không được đưa toàn bộ nghiệp vụ chỉ vào frontend. Backend phải kiểm tra và thực thi các quy tắc quan trọng.

## 7. Chuyển đổi giao diện hiện tại

Đọc và kiểm tra:
- src/App.tsx
- src/store.tsx
- src/demo.ts
- src/domain.ts
- src/pages.tsx
- src/components/Login.tsx
- src/components/TaskForms.tsx
- src/components/TaskDrawer.tsx
- src/components/ImportWizard.tsx
- src/components/BusinessClock.tsx

Giữ các component hiện có.

Thay đổi theo từng bước:
- Thay Login DEMO bằng xác thực thật.
- Thay dữ liệu bộ nhớ bằng API.
- Giữ các hàm và thuật toán nghiệp vụ đã được kiểm thử.
- Không làm thay đổi giao diện không cần thiết.
- Dashboard giữ ngày, tháng, giờ Việt Nam và có thể hiển thị ngày âm chính xác.

## 8. Cloudflare Workers Static Assets và Worker API

Chuẩn bị cấu hình:
- `wrangler.jsonc` cho Workers: `main=worker/index.ts`, `assets.directory=dist`, binding `ASSETS`.
- Worker TypeScript xử lý `/api` và `/api/*` trước static assets bằng `assets.run_worker_first`.
- Bindings cho D1 và R2.
- Secrets cho hệ thống Auth và các thao tác máy chủ.
- Routing SPA.
- Định tuyến API `/api/*`.
- Cấu hình để request tới tài nguyên tĩnh không gọi Function nếu không cần.
- Môi trường development, staging và production độc lập.

Dùng Workers Static Assets + Worker API theo yêu cầu mới nhất; không tạo Pages Project. SPA fallback chỉ phục vụ UI; API luôn giữ JSON, kể cả request navigation. Không coi push một nhánh khác main là tự động an toàn cho Production; Theo A.2 Preview dùng khối `previews` và `wrangler preview`, không `wrangler deploy`/`versions upload`. Nhánh feature chỉ push sau khi xác minh Preview Builds; chưa xác minh thì dừng trước push.

## 9. Quy trình triển khai theo chặng

CHẶNG A — Kiểm tra và tích hợp hạ tầng:
- Kiểm tra mã nguồn hiện tại.
- Sao lưu và tạo nhánh Git riêng.
- Cài công cụ phát triển trong dự án.
- Thiết lập Cloudflare Workers Static Assets.
- Tạo API `/api/health`.
- Kiểm tra frontend và backend chạy chung một project tại local.
- Giữ nguyên UI Mock.

CHẶNG B — Database và phân quyền:
- Tạo schema D1 Multi-Tenant.
- Tạo migration và seed dữ liệu danh mục Hương Đô.
- Thiết lập xác thực người dùng.
- Kiểm thử quyền giữa Tenant A và Tenant B.
- Bootstrap Super Admin một cách an toàn.

CHẶNG C — Quản trị hệ thống:
- Tenant TreeView.
- Cơ cấu tổ chức.
- Tài khoản và phân quyền.
- Mời kích hoạt, đặt lại mật khẩu và thu hồi quyền.

CHẶNG D — Nghiệp vụ:
- CRUD nhiệm vụ thật.
- Tiến độ và hoàn thành.
- Dashboard và báo cáo.
- Đôn đốc, gia hạn.
- Import/export Excel.
- File đính kèm R2.

CHẶNG E — Triển khai:
- Kiểm thử tự động.
- Kiểm tra các trường hợp truy cập sai Tenant.
- Kiểm tra backup/restore D1 và R2.
- Tạo bản Cloudflare Worker Preview.
- Chạy thử với dữ liệu giả lập.
- Chỉ deploy Production sau khi được phê duyệt.

## 10. Việc thực hiện trong lượt này

Hãy thực hiện CHẶNG A trên mã nguồn local hiện tại.

Được phép tạo file cấu hình, API mẫu, lớp API frontend và cài dependency cấp dự án.

Không được thay login DEMO bằng cơ chế đăng nhập chưa hoàn chỉnh hoặc làm hỏng chức năng hiện có.

Không chạy migration trên remote database.

Không triển khai production và không tự thay đổi Vercel.

Sau Chặng A:
- Chạy build.
- Chạy các bài test hiện có.
- Kiểm tra API `/api/health`.
- Kiểm tra frontend vẫn hoạt động.
- Báo cáo file đã tạo/sửa.
- Trả về URL local và hướng dẫn mở để tôi nghiệm thu.
- Liệt kê các thao tác cần tôi thực hiện trong Cloudflare Dashboard.

Sau khi tôi duyệt Chặng A, mới bắt đầu Chặng B.

Mục tiêu là tích hợp Cloudflare vào phần mềm hiện có, bảo toàn toàn bộ nghiệp vụ và chuẩn bị phát triển thành sản phẩm Multi-Tenant sử dụng cho nhiều cơ quan.