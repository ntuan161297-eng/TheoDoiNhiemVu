# NGHIỆM THU CHẶNG 1 — UI MOCK

Ngày báo cáo: 05/11/2026 (giờ Việt Nam). Phạm vi: frontend minh họa của hệ thống Theo dõi và Đôn đốc nhiệm vụ UBND xã Hương Đô. Chưa nghiệm thu phần mềm vận hành với dữ liệu thật.

## 1. Mở để duyệt

URL local: **http://127.0.0.1:5173/**. Chọn vai trò và bấm “Vào giao diện DEMO”; không nhập tài khoản thật. Nếu server đã dừng, chạy `npm run dev` từ thư mục dự án.

Header/menu ngang đưa tới đúng năm trang. Tất cả màn hình có nhãn DỮ LIỆU MINH HỌA. Dữ liệu và file chọn trong phiên mất khi tải lại trang; khi đó quay về màn hình đăng nhập mẫu và bộ dữ liệu ban đầu.

## 2. Bàn giao

| Hạng mục | Kết quả |
|---|---|
| Đăng nhập | Mẫu hai vai trò: Văn phòng có thao tác, Lãnh đạo chỉ xem; ghi rõ chưa xác thực |
| Tổng quan | Sáu KPI tính động, donut hoàn thành/chưa hoàn thành, ưu tiên cảnh báo, chip gia hạn/đôn đốc, đủ 11 đơn vị |
| Nhiệm vụ | Tìm/lọc theo danh mục/trạng thái/ngày giao, phân trang/sort, thêm/sửa, tiến độ, hoàn thành, snapshot hạn |
| Cần đôn đốc | Chọn nhiều nhiệm vụ, ghi chung văn bản, sửa bản ghi không tăng lượt |
| Báo cáo đơn vị | Đủ 11 đơn vị kể cả 0, drill-down giữ bộ lọc, tải CSV tổng hợp và chi tiết |
| Danh mục/cấu hình | Seed chuẩn, quy tắc hạn, vai trò xem thử, khôi phục DEMO, ví dụ loading/error/retry |
| Drawer | Thông tin/Tiến độ/Đôn đốc/Gia hạn/Lịch sử; timeline minh họa ban đầu và thao tác mới |
| Gia hạn | Đề nghị/file, một pending/task, chấp thuận hoặc từ chối có phản hồi; chỉ approved đổi hạn, giữ hạn gốc |
| Import | Wizard ba bước; kịch bản hợp lệ/lỗi/trùng; lỗi chặn, xác nhận mới thêm vào bộ nhớ; tải mẫu Excel V1.3 |
| Tệp | Chọn tệp trong phiên, giới hạn DEMO 10 MB; tài liệu mẫu tải TXT và có nhãn mẫu |
| Responsive | Desktop 1366×768, tablet 768×1024, mobile 390×844; bảng cuộn trong vùng riêng, form/drawer thích ứng |

## 3. Bằng chứng kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | TypeScript strict và Vite build thành công |
| `npm run test` | 14 kiểm thử quy tắc/dữ liệu đạt |
| `npm run test:ui` | Sáu kịch bản Playwright/Edge đạt; có ảnh ở ba độ phân giải |
| HTTP local | GET / trả 200 tại localhost:5173 |
| Dependency | Lần cài cuối báo 0 vulnerabilities; không cài SDK/SQL Server hoặc trình duyệt mới |

Các kiểm thử có ý nghĩa nghiệp vụ:

- Mốc hạn 6/5/3/2/0/−1 ngày; ngày Việt Nam chuyển tại 17:00 UTC.
- Đang xin và bị từ chối không đổi hạn; lần hai pending giữ hạn đã duyệt lần một.
- Hoàn thành dựa trên ngày thực tế và snapshot; 100% chưa tự hoàn thành.
- Đếm ID duy nhất, không nhân theo phối hợp/văn bản; đẳng thức Tổng = Hoàn thành + Chưa hoàn thành.
- Lọc AND, drill-down quá hạn; thêm/sửa/hoàn thành cập nhật đúng giao diện.
- Đôn đốc hai nhiệm vụ chung một văn bản; sửa vẫn giữ số lượt.
- Import có lỗi chặn; ba dòng hợp lệ chỉ thêm sau xác nhận; vai trò chỉ xem không có nút ghi.
- Mobile mở form/drawer, cập nhật tiến độ và hiển thị empty state; không tràn chiều ngang trang ở năm màn hình.
- CSV chi tiết đúng bốn nhiệm vụ quá hạn trong bộ mẫu; CSV tổng hợp đủ 11 đơn vị, các đơn vị không có dữ liệu vẫn hiện 0.

Bộ mẫu khởi tạo: **18 nhiệm vụ = 5 hoàn thành + 13 chưa hoàn thành**; 3 nguy cơ, 2 khẩn, 4 quá hạn, 4 còn hạn; 2 đang xin gia hạn, 4 nhiệm vụ đã đôn đốc, 6 lượt văn bản–nhiệm vụ. Các số được tính từ dữ liệu, không đặt cố định trong component KPI. Hạn mẫu sinh tương đối theo ngày Việt Nam lúc khởi tạo; khi qua ngày mới trong phiên các cảnh báo sẽ tính lại.

## 4. Ảnh xem nhanh

- [Đăng nhập desktop](screenshots/login-desktop.png), [đăng nhập mobile](screenshots/login-mobile.png).
- [Dashboard desktop](screenshots/dashboard-desktop.png), [tablet](screenshots/dashboard-tablet.png), [mobile](screenshots/dashboard-mobile.png).
- [Danh sách desktop](screenshots/tasks-desktop.png), [tablet](screenshots/tasks-tablet.png), [mobile](screenshots/tasks-mobile.png).
- [Cần đôn đốc desktop](screenshots/expedite-desktop.png), [tablet](screenshots/expedite-tablet.png), [mobile](screenshots/expedite-mobile.png).
- [Báo cáo desktop](screenshots/reports-desktop.png), [tablet](screenshots/reports-tablet.png), [mobile](screenshots/reports-mobile.png).
- [Danh mục desktop](screenshots/catalog-desktop.png), [tablet](screenshots/catalog-tablet.png), [mobile](screenshots/catalog-mobile.png).
- [Form nhiệm vụ desktop](screenshots/form-task-desktop.png), [form mobile](screenshots/form-task-mobile.png).
- [Drawer hoàn thành](screenshots/drawer-completed-desktop.png), [drawer gia hạn đang chờ](screenshots/drawer-extension-pending.png), [drawer tiến độ mobile](screenshots/drawer-progress-mobile.png).
- [Import bước 1](screenshots/import-step-1.png), [bước 2 có lỗi](screenshots/import-step-2-error.png), [bước 3 xác nhận](screenshots/import-step-3.png).
- [Không có kết quả trên mobile](screenshots/tasks-empty-mobile.png).

## 5. Phần vẫn mô phỏng và giới hạn

- Không có backend/API, SQL Server, Identity hoặc quyền bảo mật thật. Vai trò chỉ điều khiển cách trình bày và thao tác trong DEMO.
- Không lưu bền vững nhiệm vụ, file, audit hoặc cấu hình. Tải lại sẽ mất thay đổi. Không đưa dữ liệu hành chính thật vào bản mẫu.
- Chọn `.xlsx` chỉ đọc tên tệp. Preview dùng kịch bản minh họa, chưa parse workbook, chưa cập nhật bản ghi thật hay ghi transaction.
- Xuất CSV dữ liệu đang lọc có hoạt động; chưa có workbook báo cáo Excel nhiều sheet.
- Danh mục chuẩn được hiển thị để duyệt, chưa có quản trị danh mục/tài khoản thật. Công tắc cấu hình được ghi rõ chỉ minh họa, chưa áp dụng nghiệp vụ.
- Chưa có nghiệp vụ hủy/đính chính gia hạn đã áp dụng hoặc hồi tố sau hoàn thành; cần chốt trước chặng nghiệp vụ thật.
- Build thành công có cảnh báo kích thước bundle JS khoảng 1,75 MB chưa gzip (khoảng 544 kB gzip). Cần chia tải trước triển khai production; chưa tối ưu theo quy mô vận hành chưa được chốt.
- Browser QA dùng Microsoft Edge headless có sẵn trên máy với viewport desktop/tablet/mobile; chưa phải kiểm tra trên thiết bị vật lý hoặc Safari/iOS.

Chưa chạy hoặc nhận đạt những tiêu chí V1.3 về lưu DB, quyền server, file bảo vệ và khôi phục backup. Các tiêu chí này thuộc Chặng 2–4.

## 6. File tạo và thay đổi

Tạo mới mã nguồn trong `src/` (App/main/pages/domain/demo/store/files/styles; components TaskDrawer/TaskForms/ImportWizard/shared), `public/favicon.svg`, `index.html`; cấu hình npm/TypeScript/Vite/Vitest/Playwright và lockfile; `src/domain.test.ts`, `tests/ui/workspace.spec.ts`; `README.md`, `docs/IMPLEMENTATION_PLAN.md`, tài liệu này và ảnh trong `docs/qa/screenshots/`.

Sinh `node_modules/`, `dist/`, `test-results/`, `*.tsbuildinfo` phục vụ chạy/kiểm tra; đã đưa vào `.gitignore`. Tài liệu gốc `docs/product`, `prompts`, `README_BAT_DAU.md` được giữ nguyên. Không sửa hoặc sao chép mã repo VanPhongSo; không khởi tạo backend, cài .NET/SQL Server, commit/push hoặc deploy.

**Chờ chủ sản phẩm duyệt Chặng 1. Chưa chuyển Chặng 2.**
