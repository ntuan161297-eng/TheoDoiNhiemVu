# CHECKLIST NGHIỆM THU MVP V1.3

| ID | Tình huống | Kết quả bắt buộc |
|---|---|---|
| TC01 | Tạo nhiệm vụ có đủ trường bắt buộc | Lưu DB, mã hệ thống tự sinh, xuất hiện danh sách & Dashboard |
| TC02 | Thiếu đơn vị chủ trì/lãnh đạo/hạn gốc | Form chặn lưu, hiển thị đúng tên trường lỗi |
| TC03 | Một văn bản tạo 3 nhiệm vụ | Thống kê 3 nhiệm vụ nhưng một văn bản căn cứ, không mất quan hệ |
| TC04 | Còn 6 ngày đến hạn | Nhãn `Còn hạn` |
| TC05 | Còn đúng 5 hoặc 3 ngày | Nhãn `Nguy cơ chậm` |
| TC06 | Còn 2 hoặc 0 ngày | Nhãn `Sắp đến hạn — khẩn` |
| TC07 | Ngày hôm nay lớn hơn hạn hiệu lực 1 ngày | Nhãn `Quá hạn` |
| TC08 | Nhập văn bản đôn đốc lần 1, file và số VB | Số lần = 1; lịch sử và file đúng |
| TC09 | Mở lại/sửa cùng bản ghi đôn đốc | Số lần không tăng |
| TC10 | Một VB đôn đốc 2 nhiệm vụ | Mỗi nhiệm vụ +1, bản thân văn bản chỉ lưu 1 lần |
| TC11 | Nhập đề nghị gia hạn chưa có phê duyệt | Hiển thị `Đang xin gia hạn`; hạn hiệu lực giữ nguyên |
| TC12 | Nhiệm vụ quá hạn đồng thời đang xin gia hạn | Vẫn hiện ở `Quá hạn` và nhóm `Đang xin gia hạn` |
| TC13 | Có văn bản chấp thuận với hạn mới | Hạn hiệu lực thay bằng hạn được duyệt; hạn gốc và lịch sử giữ nguyên |
| TC14 | Văn bản từ chối gia hạn | Hạn hiệu lực giữ nguyên; lưu số/ngày VB từ chối |
| TC15 | Đề nghị gia hạn lần 2 sau lần 1 được duyệt | Hạn hiệu lực = hạn duyệt lần 1 cho đến khi lần 2 được duyệt |
| TC16 | Hoàn thành ngày trước hoặc đúng hạn | Gắn `Hoàn thành đúng hạn` |
| TC17 | Hoàn thành sau hạn hiệu lực | Gắn `Hoàn thành chậm hạn`, không còn nhóm quá hạn chưa xong |
| TC18 | Hoàn thành nhưng thiếu ngày thực tế/kết quả | Chặn xác nhận |
| TC19 | Import Excel mẫu 3 dòng hợp lệ | Xem trước, xác nhận, import đủ 3 bản ghi, không import sheet `VI_DU` tự động |
| TC20 | Import sai tên đơn vị/nguồn/lãnh đạo | Báo lỗi dòng + cột, không tạo dữ liệu sai |
| TC21 | Import lại cùng `Mã đối chiếu` | Phát hiện trùng, hỏi cách xử lý; không thêm âm thầm |
| TC22 | Import Excel có 1 dòng lỗi và 3 dòng đúng | Mặc định không ghi một phần trước khi người dùng xác nhận chính sách xử lý |
| TC23 | Một nhiệm vụ có 3 đơn vị phối hợp | Tổng nhiệm vụ toàn xã và theo chủ trì chỉ +1; tra cứu phối hợp tìm được |
| TC24 | Lọc một nguồn + một lãnh đạo + một đơn vị | KPI và bảng cùng dùng tập dữ liệu; đếm khớp |
| TC25 | Click KPI `Quá hạn` | Mở danh sách chính xác các nhiệm vụ quá hạn với bộ lọc hiện tại |
| TC26 | Xuất Excel báo cáo theo 11 đơn vị | Chỉ tiêu đúng, không cộng chéo hoàn thành chậm với hoàn thành tổng |
| TC27 | Đăng xuất, đăng nhập lại | Dữ liệu nhiệm vụ, file metadata, đôn đốc, gia hạn vẫn còn |
| TC28 | User chỉ đọc cố cập nhật qua API | Backend chặn (không chỉ ẩn nút trên frontend) |
| TC29 | Sửa/hủy văn bản gia hạn/đôn đốc | Có nhật ký tác động và trước/sau; không xóa lịch sử đã sử dụng để tính hạn |
| TC30 | Hiển thị 1366x768 và 390x844 | Không chồng chữ, nút chính nhìn thấy; bảng có cuộn hợp lý |

## Dữ liệu test ngày tháng
Giả sử ngày hệ thống cố định là `04/11/2026` tại Asia/Ho_Chi_Minh, nhiệm vụ chưa hoàn thành:
- Hạn `10/11/2026`: còn 6 ngày → Còn hạn.
- Hạn `09/11/2026`: còn 5 ngày → Nguy cơ chậm.
- Hạn `07/11/2026`: còn 3 ngày → Nguy cơ chậm.
- Hạn `06/11/2026`: còn 2 ngày → Khẩn.
- Hạn `04/11/2026`: còn 0 ngày → Khẩn.
- Hạn `03/11/2026`: quá 1 ngày → Quá hạn.

## Definition of Done
- Không hard-code thống kê, toàn bộ CRUD và báo cáo lấy từ database.
- API có kiểm tra quyền và validation; giao diện hiện lỗi nghiệp vụ dễ hiểu.
- Các test trạng thái hạn + gia hạn + đôn đốc + import chạy tự động khi có thay đổi.
- Dữ liệu minh họa được đánh dấu DEMO, không sử dụng tên/số văn bản giả làm thật.
- Có hướng dẫn cài đặt, seed danh mục, chạy thử và sao lưu dữ liệu.
