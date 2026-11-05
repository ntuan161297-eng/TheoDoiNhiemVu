# NÂNG CẤP UI/UX — UBND XÃ HƯƠNG ĐÔ

Ngày: 05/11/2026. Thực hiện trên dự án UI mock hiện tại theo yêu cầu nâng cấp và hai ảnh tham khảo của chủ sản phẩm. Phạm vi vẫn là Chặng 1.

## Thiết kế đã thay đổi

- **Design System:** Be Vietnam Pro lưu trong dependency dự án, hỗ trợ tiếng Việt; không gọi Google Fonts khi sử dụng. Màu, control, bảng, form, modal và typography dùng chung CSS variables và Ant Design theme tokens.
- **Typography:** tiêu đề trang 26/700; tiêu đề khối 18/700; nhãn form 14/600; nội dung chính 14–15px; caption chính 12–13px; số KPI 34–38px, đậm 800. Có điều chỉnh kích thước cho màn hình nhỏ.
- **Nhận diện:** header navy 68px, tên cơ quan nổi bật, menu ngang có active/hover/focus, icon giao diện tùy biến dùng Lucide thống nhất. Giữ icon nội bộ tiêu chuẩn của các control Ant Design.
- **Đăng nhập:** hai cột 44/56, phong cảnh minh họa với lớp phủ navy, tiêu đề lớn và điểm nhấn vàng; form sáng căn giữa, input 48px, vai trò DEMO và cảnh báo minh họa. Bố cục được kiểm tra ở chiều cao 768px; đồng hồ theo giờ Việt Nam, không thêm số thời tiết hoặc thông tin cá nhân giả.
- **Dashboard:** phần tiêu đề có nền phong cảnh nhẹ, nhãn ngày theo dõi; banner DEMO gọn; sáu KPI tính động, màu ngữ nghĩa, số lớn, tỷ lệ hiển thị nhất quán. Các nhóm cảnh báo vẫn độc lập với trạng thái thực hiện/gia hạn.
- **Điều hành:** bảng ưu tiên quá hạn → khẩn → nguy cơ, số ngày còn/quá rõ, nút xem/đôn đốc nhanh. Thêm danh sách đơn vị cần chú ý và cơ cấu theo ba nguồn, tính từ đúng bộ lọc đang áp dụng.
- **Báo cáo:** donut phân tách Hoàn thành/Đang thực hiện/Chưa thực hiện; bảng tổng hợp Dashboard đủ 11 đơn vị, có thanh tỷ lệ hoàn thành. Trang báo cáo vẫn giữ các chỉ tiêu chi tiết.
- **Bảng nhiệm vụ:** nội dung đậm, header rõ, hover, thao tác cố định bên phải. Trên desktop nhỏ, lãnh đạo hiển thị dưới chủ trì và tình trạng gia hạn trong nhóm trạng thái; màn hình rộng có cột riêng. Thông tin vẫn có trong drawer và xuất CSV.
- **Form:** nhóm nghiệp vụ, dấu bắt buộc, nhãn đậm, control 42px, hai cột/một cột responsive; nội dung form cuộn riêng, Lưu/Hủy dễ truy cập. Wizard ba bước hiển thị ngang gọn hơn trên mobile.
- **Tương tác:** transition 180ms, focus rõ, chế độ giảm chuyển động, loading/empty/error/toast tiếp tục hoạt động.

## Kiểm tra

| Nội dung | Kết quả |
|---|---|
| TypeScript strict + Vite production build | Thành công |
| Kiểm thử quy tắc nghiệp vụ | 14/14 đạt |
| Playwright / Microsoft Edge headless | 7 kịch bản đạt: 6 luồng hiện có và 1 kiểm tra Design System |
| Độ phân giải | 1366×768, 1920×1080, tablet 768×1024 và mobile 390×844 |
| Bố cục | Năm trang không tràn chiều ngang toàn trang; bảng dài cuộn trong vùng riêng; đăng nhập nằm gọn trong viewport 1366×768 |
| Font | Kiểm tra font Be Vietnam Pro thực sự được nạp, cỡ/độ đậm tiêu đề, KPI và nhãn form |
| Tương phản | 31 mẫu màu chữ chính và Tag trạng thái đạt ít nhất 4,5:1; thấp nhất đo được 5,21:1. Gồm nút chính, caption, nhãn bộ lọc, nội dung bảng và Tag. Giá trị chi tiết ở contrast.json |
| Localhost | http://127.0.0.1:5173/ trả HTTP 200 |
| Dependency | Thêm Be Vietnam Pro và Lucide; lần cài đặt hoàn tất báo 0 vulnerabilities |

Dự án chưa có cấu hình ESLint riêng; kiểm tra tĩnh dùng TypeScript strict qua lệnh build. Build vẫn có cảnh báo kích thước bundle, không có lỗi chặn. Browser QA dùng viewport mô phỏng của Microsoft Edge, không phải thiết bị iOS/Android vật lý. Phép đo tương phản cho các thành phần đã liệt kê không thay thế đánh giá accessibility toàn bộ ứng dụng.

## Ảnh và bằng chứng

| Màn hình | 1366px | 1920px | Mobile |
|---|---|---|---|
| Đăng nhập | [Ảnh](ui-upgrade/login-desktop.png) | [Ảnh](ui-upgrade/login-wide.png) | [Ảnh](ui-upgrade/login-mobile.png) |
| Dashboard | [Ảnh](ui-upgrade/dashboard-desktop.png) | [Ảnh](ui-upgrade/dashboard-wide.png) | [Ảnh](ui-upgrade/dashboard-mobile.png) |
| Danh sách nhiệm vụ | [Ảnh](ui-upgrade/tasks-desktop.png) | [Ảnh](ui-upgrade/tasks-wide.png) | [Ảnh](ui-upgrade/tasks-mobile.png) |
| Cần đôn đốc | [Ảnh](ui-upgrade/expedite-desktop.png) | [Ảnh](ui-upgrade/expedite-wide.png) | [Ảnh](ui-upgrade/expedite-mobile.png) |
| Báo cáo | [Ảnh](ui-upgrade/reports-desktop.png) | [Ảnh](ui-upgrade/reports-wide.png) | [Ảnh](ui-upgrade/reports-mobile.png) |
| Danh mục | [Ảnh](ui-upgrade/catalog-desktop.png) | [Ảnh](ui-upgrade/catalog-wide.png) | [Ảnh](ui-upgrade/catalog-mobile.png) |

Ảnh tablet, form, drawer và ba bước import cũng nằm trong `docs/qa/ui-upgrade/`. [Kết quả đo tương phản](ui-upgrade/contrast.json). Bộ ảnh UI ban đầu trong `docs/qa/screenshots/` được giữ để so sánh.

## Tài sản hình ảnh

`public/assets/huong-do-countryside.png` được tạo bằng **image_gen tích hợp**, không dùng CLI/API fallback. Đây là phong cảnh hư cấu gợi miền quê miền Trung, không xác nhận là ảnh thực tế của trụ sở hoặc địa điểm xã Hương Đô. Giao diện có nhãn “Phong cảnh minh họa”. Không thêm quốc huy/logo pháp lý chưa được phê duyệt.

[Nguồn gốc và prompt đầy đủ](../../public/assets/README.md).

## Mã nguồn thay đổi

| File/nhóm | Nội dung |
|---|---|
| `src/design-system.ts` (mới) | Palette và Ant Design theme dùng chung |
| `src/styles.css` | Làm lại hệ thống CSS, typography, layout, tương tác và responsive |
| `src/main.tsx` | Font lưu local và cấu hình theme |
| `src/components/icons.tsx` (mới) | Một bộ icon Lucide; giữ tên alias để không đổi logic thành phần |
| `src/components/Login.tsx`, `BusinessClock.tsx`, `PageHeading.tsx` (mới) | Đăng nhập, đồng hồ Việt Nam và tiêu đề trang |
| `src/App.tsx` | Dùng các thành phần nhận diện mới, điều chỉnh header/banner |
| `src/pages.tsx` | KPI, bố cục Dashboard, cơ cấu nguồn, đơn vị chú ý, bảng thích ứng và thao tác nhanh |
| `src/components/shared.tsx` | Icon và màu hạn theo nhóm cảnh báo |
| `src/components/TaskDrawer.tsx` | Thay icon tùy biến bằng Lucide |
| `src/components/TaskForms.tsx` | Hiện rõ dấu bắt buộc; nghiệp vụ giữ nguyên |
| `src/components/ImportWizard.tsx` | Icon và trình bày ba bước ngang responsive |
| `package.json`, `package-lock.json` | Hai dependency giao diện mới |
| `tests/ui/workspace.spec.ts` | Thêm viewport 1920px, ảnh đăng nhập đúng kích thước và bộ ảnh nâng cấp |
| `tests/ui/design.spec.ts` (mới) | Font, typography, tương phản AA và khung đăng nhập |
| `public/assets/`, `docs/qa/UI_UX_UPGRADE.md`, `README.md` | Ảnh nền, nguồn gốc/prompt, báo cáo và hướng dẫn |

Các file `src/domain.ts`, `src/demo.ts`, `src/store.tsx`, seed và tài liệu nghiệp vụ không bị sửa trong đợt nâng cấp này. Giữ nguyên luồng thêm/sửa, xác nhận, đôn đốc, gia hạn, import mô phỏng, vai trò DEMO và xuất CSV. Tỷ lệ chỉ đổi cách trình bày thống nhất theo dấu phẩy thập phân tiếng Việt, không đổi số đếm.

**Vẫn chỉ là UI mock: chưa đọc Excel thật, chưa lưu cơ sở dữ liệu hoặc xác thực thật; không triển khai backend/SQL Server, push hoặc deploy.**
