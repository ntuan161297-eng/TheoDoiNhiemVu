# ĐỐI CHIẾU GITHUB VANPHONGSO — TÁI SỬ DỤNG CÓ KIỂM SOÁT

> Đây là audit tham khảo đã thực hiện ở thời điểm ghi trong tài liệu, không phải kế hoạch backend hiện hành. Các bước xây backend công nghệ cũ ở phần khuyến nghị đã được [master Cloudflare](../cloudflare/MASTER_PROMPT.md) và [kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) thay thế. Tiếp tục giữ nguyên quy tắc không sửa repo nguồn và không sao chép mock/KPI/auth của tỉnh.

**Repository được xem trực tiếp ngày 04/11/2026:** https://github.com/ntuan161297-eng/VanPhongSo (nhánh `main`). Đây là repo tham khảo, KHÔNG chỉnh sửa repo nguồn cho bài toán xã Hương Đô.

## 1. Công nghệ đã kiểm chứng
`package.json`: React 18, TypeScript, Vite 8, Ant Design 6, `@ant-design/icons`, `lucide-react`, `recharts`, `react-router-dom`, `dayjs`; frontend. `server.js` chỉ serve thư mục `dist` qua HTTP, không phải backend CRUD nghiệp vụ. `README.md` nói rõ dữ liệu nghiệp vụ ở dạng mock và adapter để kết nối trong tương lai.

## 2. Thành phần có thể tham khảo/tái sử dụng
| Đường dẫn trong repo nguồn | Cách dùng cho MVP xã |
|---|---|
| `src/components/layout/AppHeader.tsx`, `AppLayout.tsx` | Tham khảo cấu trúc header/nav, **viết phiên bản Hương Đô giản lược**, không giữ các vai trò/địa bàn tỉnh |
| `src/components/common/KPICard.tsx` | Tái dùng thiết kế thẻ chỉ số, sửa props/accessibility khi cần |
| `src/components/common/FilterBar.tsx` | Tham khảo layout filter, bỏ trường `địa bàn toàn tỉnh`, thêm `Nguồn nhiệm vụ`, `Lãnh đạo` |
| `src/components/common/StatusBadge.tsx` | Tham khảo component badge; thay enum status cũ bằng executionStatus + deadlineBucket |
| `src/features/tasks/TaskDashboard.tsx`, `TaskOverviewMode.tsx` | Tái dùng ý tưởng UI KPI/donut/bảng ưu tiên; dựng trang đơn giản thay vì copy toàn bộ dashboard tỉnh |
| `src/features/tasks/TaskListPage.tsx`, `TaskDetailDrawer.tsx` | Tham khảo table/drawer, xây CRUD và biểu mẫu cho xã |
| `src/styles/main.css`, `src/index.css` | Tham khảo tone màu và typography; tách design token mới để không giữ CSS tỉnh |
| `src/services/dataService.ts` | Chỉ tham khảo interface adapter, **không tái dùng cách lấy mock làm dữ liệu thật** |
| `src/mocks/tasks.mock.ts` | Chỉ làm ví dụ cấu trúc demo; KHÔNG nhập dữ liệu Hưng Yên vào database Hương Đô |

## 3. Lỗi/nguy cơ cụ thể cần tránh (đã kiểm tra trong code)
- `TaskService.getAll()` đọc `TASKS_MOCK` trực tiếp (không fetch backend).
- `TaskService.getStats()` trả một bộ số **hard-code 124/37/28/12/... khi đủ mock**; không được mang logic này vào sản phẩm thật.
- `TaskService.expediteTask()` mutate mảng mock tại runtime; reload hoặc server restart không đảm bảo giữ lịch sử.
- Dashboard hiện chứa chế độ `Phân tích chuyên sâu`, `Đôn đốc & xử lý gấp` cùng nhiều nội dung tỉnh; MVP nên chỉ có **1 dashboard chính**.
- `src/routes/AppRoutes.tsx` chứa tuyến đường `/du-an`, `/giai-ngan`, `/ngan-sach` và role xử lý của tỉnh; bỏ hoàn toàn trong ứng dụng độc lập.
- `src/context/AppContext.tsx` chứa người dùng/đơn vị Hưng Yên và trạng thái đăng nhập frontend; không dùng làm authentication production.
- Dùng lại mã nguồn cần kiểm tra bản quyền/license. Ở repo công khai hiện không thấy file LICENSE ở root; do đó không giả định repo cho phép dùng thương mại. Vì đây là repo của chính tài khoản được người dùng cung cấp, Agent nên đề xuất xác nhận quyền chủ sở hữu và phạm vi tái sử dụng trước khi copy nguyên khối.

## 4. Chiến lược tích hợp phù hợp nhất
1. Tạo folder/repo **mới** `ubnd-huong-do-tasks`; không `git push` vào VanPhongSo.
2. Dùng cùng stack và Ant Design, **bóc tách giao diện** từ 4–6 component common. Ưu tiên viết lại component gọn hơn copy màn hình quá lớn.
3. Phase UI tạo mock DTO Hương Đô với 11 đơn vị, 3 nguồn, 3 lãnh đạo và dữ liệu mẫu có nhãn DEMO. Không giữ tên tỉnh, hình Phố Hiến hay lãnh đạo tỉnh.
4. Phase backend xây ASP.NET Core + SQL Server, API thật, auth thật. Frontend gọi `taskApi` (typed), loại bỏ phụ thuộc `TASKS_MOCK` khỏi các trang nghiệp vụ.
5. Build/lint/test; chạy trong LAN trước khi xem xét môi trường Internet. Cẩn trọng `server.js` tĩnh cũ chưa phải máy chủ dữ liệu có xác thực.

## 5. Các nguồn để Agent đọc trực tiếp
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/package.json
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/components/common/KPICard.tsx
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/components/common/FilterBar.tsx
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/features/tasks/TaskDashboard.tsx
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/features/tasks/TaskListPage.tsx
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/features/tasks/TaskDetailDrawer.tsx
- https://github.com/ntuan161297-eng/VanPhongSo/blob/main/src/services/dataService.ts

**Nghiêm cấm:** Nói hệ thống đã lưu dữ liệu thật khi mới dùng mock; tự đặt số KPI trong JSX; thay thế/sửa/gộp repo nguồn mà không có lệnh riêng.
