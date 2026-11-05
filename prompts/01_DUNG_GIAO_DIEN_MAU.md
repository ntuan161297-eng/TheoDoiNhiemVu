Chỉ thực hiện sau khi kế hoạch của Prompt 00 được tôi duyệt. Đọc `docs/product/00_DOC_TRUOC.md`, `01_MASTER_PRD_MVP.md`, `02_UI_UX_BLUEPRINT.md`, `01_PRD_NGHIEP_VU_V13.md`, `02_UI_UX_V13.md` cùng seed CSV.

Hãy dựng FRONTEND mẫu cho ứng dụng UBND xã Hương Đô dùng React + TypeScript + Vite + Ant Design + Recharts. Tham khảo diện mạo `https://github.com/ntuan161297-eng/VanPhongSo`, nhưng KHÔNG ghi đè repo nguồn, không mang tên Hưng Yên, không bê số liệu mock hardcode, không làm dự án/giải ngân/ngân sách.

Yêu cầu: (1) Dashboard KPI tính động từ mock; (2) Danh sách nhiệm vụ, lọc/sort/truy cập chi tiết; (3) biểu mẫu thêm/sửa, cập nhật tiến độ, xác nhận hoàn thành; (4) trang cần đôn đốc; (5) bảng tổng hợp 11 đơn vị. Có drawer chi tiết các tab Thông tin/Tiến độ/Đôn đốc/Gia hạn/Lịch sử. Có UI import Excel wizard (chưa nhập DB). Có UI ghi văn bản đôn đốc nhiều nhiệm vụ, UI xin gia hạn và chấp thuận/từ chối. Dùng dữ liệu giả 12–20 nhiệm vụ đủ mọi trạng thái, ghi rõ 'DỮ LIỆU MINH HỌA'. Không làm backend, không làm đăng nhập giả như thật.

Tiêu chí: xanh navy/trắng, UX dễ đọc 1366px, responsive, hợp ngôn ngữ Việt, có loading/empty/error, hạn cảnh báo màu + chữ. Các nút lọc/KPI/drawer phải tương tác trên mock và không hardcode số KPI.

Sau khi xong: chạy `npm run build`, thông báo URL chạy local và cách tôi xem 5 màn hình; liệt kê phần đã làm, chưa làm, và chờ tôi duyệt trước giai đoạn sau.
