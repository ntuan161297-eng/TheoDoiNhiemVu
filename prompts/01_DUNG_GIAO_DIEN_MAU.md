# BẢO TOÀN UI MOCK HIỆN CÓ

Đọc master Cloudflare, kế hoạch và báo cáo `docs/qa/CLOUDFLARE_WORKERS_STAGE_A.md`; đây không phải lệnh khởi tạo frontend mới. UI đã có và phải được giữ lại. Chỉ sửa UI khi lượt yêu cầu cụ thể cho phép.

Giữ React/TypeScript/Vite/Ant Design/Recharts, theme/font/icon/nav/header navy; năm trang nghiệp vụ + login, bộ lọc, 6 KPI tính từ dữ liệu, bảng đủ 11 đơn vị Hương Đô, form/Drawer năm tab, import wizard ba bước, đôn đốc nhiều nhiệm vụ và gia hạn. Giữ giờ Việt Nam, ngày/tháng và accessibility/responsive. TreeView chưa có thì ghi đúng là chưa có; thuộc C, không bịa chức năng đã hoàn thành. Âm lịch nếu thêm phải đúng và có test.

DEMO phải có nhãn rõ, không giả đăng nhập/lưu DB thật. KPI không hardcode; trạng thái thực hiện/hạn/gia hạn tách biệt, pending không đổi hạn, snapshot khi hoàn thành, phối hợp không cộng trùng. Không copy dữ liệu Hưng Yên, không thêm phân hệ dự án/ngân sách.

Khi đổi nền tảng, giữ component và thay adapter/service từng bước. Chưa B/D thì giữ DemoProvider/login đang chạy; không nối vào Auth hoặc endpoint chưa hoàn chỉnh. C hiện được phép mở rộng vùng quản trị theo master sau khi được duyệt, không bỏ yêu cầu đó chỉ vì giới hạn 5 trang nghiệp vụ cũ.

Kiểm tra build và UI theo thay đổi được giao; ưu tiên test `npm run test:ui:worker` trên Worker local, giữ ảnh nghiệm thu cũ. Báo đúng file sửa, thao tác đã hoạt động, phần còn mô phỏng và chặng cần duyệt tiếp; không tự làm B–E.
