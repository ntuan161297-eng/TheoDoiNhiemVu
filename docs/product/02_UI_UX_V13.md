# UI/UX BLUEPRINT V1.3 — ỨNG DỤNG THEO DÕI NHIỆM VỤ HƯƠNG ĐÔ

## A. Triết lý
- Người dùng trọng tâm là Lãnh đạo/Chuyên viên Văn phòng, thao tác hằng ngày trên máy tính; giao diện đủ đẹp để báo cáo lãnh đạo nhưng ưu tiên đọc nhanh và nhập nhanh hơn biểu đồ trang trí.
- Tham khảo màu sắc/menu ngang/cards/chart của repository `ntuan161297-eng/VanPhongSo`. Không mang 4 phân hệ lớn hay các bộ lọc cấp tỉnh sang sản phẩm xã.
- Màu: Navy `#153B60` (header), xanh `#1677FF` (tương tác), nền `#F3F7FB`, viền `#E5EDF5`, chữ `#172B4D`; xanh lá hoàn thành, vàng nguy cơ, cam cận hạn, đỏ quá hạn. Luôn kèm chữ để không phụ thuộc riêng màu.
- Desktop-first rộng 1280–1920px; tablet bố cục co giãn; mobile cho xem/tra cứu cơ bản; form dài dùng drawer rộng 760–900px hoặc trang riêng.

## B. Menu ngang tối giản
`TỔNG QUAN | NHIỆM VỤ | CẦN ĐÔN ĐỐC | THỐNG KÊ ĐƠN VỊ | DANH MỤC`

## C. Dashboard (trên cùng trong 1 màn hình)
1. Header app gọn: `UBND XÃ HƯƠNG ĐÔ / THEO DÕI VÀ ĐÔN ĐỐC NHIỆM VỤ`, tài khoản, chuông cảnh báo.
2. Bộ lọc ngang: `Năm` `Nguồn nhiệm vụ` `Đơn vị chủ trì` `Lãnh đạo` `Tìm kiếm` + `Xóa lọc`.
3. KPI hàng đầu 6 cards: Tổng nhiệm vụ | Đã hoàn thành | Đang thực hiện/chưa hoàn thành | Nguy cơ (3–5 ngày) | Khẩn (0–2 ngày) | Quá hạn. Chip nhỏ dưới bộ KPI: `Đang xin gia hạn`, `Nhiệm vụ đã đôn đốc`.
4. Khối `CẦN THEO DÕI HÔM NAY`: bảng ưu tiên Quá hạn → Khẩn → Nguy cơ. Cột `Nội dung`, `Chủ trì`, `Hạn`, `Còn/Quá`, `Đôn đốc`, `Gia hạn`, hành động `Chi tiết`/`Đôn đốc`.
5. Bảng thống kê 11 đơn vị có tổng, hoàn thành, hoàn thành chậm, đang thực hiện, nguy cơ, khẩn, quá hạn, đang xin gia hạn. Click số đếm mở bộ lọc chi tiết.
6. Biểu đồ duy nhất giai đoạn đầu: tỷ lệ hoàn thành theo đơn vị hoặc donut tổng quan; bỏ những biểu đồ xu hướng chưa có dữ liệu lịch sử thực.

## D. Trang Nhiệm vụ
- Thanh chức năng: `+ Thêm nhiệm vụ` (primary), `Import Excel`, `Tải mẫu Excel`, `Xuất Excel`.
- Bộ lọc mở rộng dạng thu gọn: 3 nguồn, 11 đơn vị, 3 lãnh đạo, trạng thái thực hiện, tình trạng hạn, tình trạng gia hạn, mức độ, từ ngày/đến ngày, có/không có đôn đốc. Tìm kiếm số VB, mã, nội dung.
- Table: STT | Mã | Nội dung nhiệm vụ | Nguồn | Chủ trì | Lãnh đạo | Hạn hiệu lực | Còn/quá ngày | Trạng thái | Số lần đôn đốc | Gia hạn | Thao tác.
- Bấm dòng mở `Drawer Chi tiết` (không điều hướng rối). Hành động ở menu: sửa, cập nhật tiến độ, đôn đốc, xin gia hạn, hoàn thành.
- Trạng thái nhiều nhãn: `Đang thực hiện` (trạng thái thực hiện), `Quá hạn` (hạn), `Đang xin gia hạn` (gia hạn) đặt trong các cột riêng.

## E. Form thêm/sửa nhiệm vụ
Chia nhóm dễ đọc (không bắt nhập một lần quá dài):
- `Nguồn và văn bản`: nguồn, số văn bản, ngày ban hành, cơ quan ban hành, trích yếu, đính kèm.
- `Nội dung`: nội dung nhiệm vụ*, lĩnh vực, ngày giao*, đơn vị chủ trì*, các đơn vị phối hợp, lãnh đạo chỉ đạo*, người theo dõi.
- `Tiến độ và hạn`: hạn gốc*, ưu tiên, trạng thái thực hiện*, ghi chú.
- Nút: `Hủy`, `Lưu nhiệm vụ`, `Lưu & thêm nhiệm vụ tiếp`. Lỗi hiển thị sát trường, tự đặt focus đến trường lỗi; chỉ 1 CTA chính.

## F. Drawer chi tiết (5 tabs)
1. `Thông tin chung`: các dữ liệu bất biến & liên quan; hành động Sửa.
2. `Cập nhật tiến độ`: timeline ngày, nội dung, %, tài liệu; hành động Xác nhận hoàn thành với form ngày thực tế + kết quả.
3. `Đôn đốc`: `Số lần đôn đốc: N`, bảng văn bản, nút `+ Ghi nhận văn bản đôn đốc`; cho chọn nhiều nhiệm vụ vào cùng văn bản ở trang Cần đôn đốc.
4. `Gia hạn`: hạn gốc, hạn hiệu lực, hạn xin gia hạn, chip trạng thái; nút `+ Thêm văn bản xin gia hạn`; đối với yêu cầu đang chờ có nút `Ghi nhận kết quả xem xét`.
5. `Lịch sử`: ai làm gì, ngày giờ, trước/sau khi sửa, file liên quan.

## G. Import Excel — Wizard 3 bước
- Bước 1: `Tải mẫu` + kéo thả/chọn file .xlsx, hiển thị tên file, số dòng.
- Bước 2: `Xem trước` bảng 10–20 dòng, bản tổng hợp `Hợp lệ`, `Cần sửa`, `Nghi trùng`; lỗi rõ tại dòng/cột (`Dòng 12, cột Đơn vị chủ trì: không có trong danh mục`). Nút tải file lỗi hoặc sửa Excel rồi tải lại.
- Bước 3: `Xác nhận import` với cách xử lý trùng được người dùng chọn, kết quả lưu/import thất bại, link xem danh sách mới import.
- **Không** tự import sheet ví dụ, không tự tăng số đôn đốc, không tự gia hạn, không tự sinh file đính kèm.

## H. Form đôn đốc
Mở khi bấm `Đôn đốc` trên nhiệm vụ hoặc chọn nhiều nhiệm vụ:
- Thẻ đầu hiển thị nhiệm vụ, hạn và trạng thái hiện tại.
- Các trường: số VB (*), ngày VB (*), đơn vị ban hành, trích yếu, nội dung yêu cầu (*), hạn phản hồi, người ký, file scan/PDF, ghi chú.
- Nút `Lưu văn bản đôn đốc` (chỉ được lưu nếu có ít nhất 1 nhiệm vụ; không tính khi form mới mở).
- Sau lưu: toast thành công, tăng count ở đúng nhiệm vụ, timeline có văn bản; cảnh báo hạn của nhiệm vụ không thay đổi.

## I. Form xin gia hạn
- Top banner: `Hạn gốc 10/11/2026` | `Hạn hiện tại 10/11/2026` | `Hạn đề nghị 20/11/2026`.
- `Văn bản đề nghị`: số văn bản, ngày, đơn vị, lý do, hạn đề nghị mới, file.
- `Kết quả`: pending/approved/rejected; nếu approved bắt buộc số/ngày VB chấp thuận, hạn được chấp thuận và file.
- Khi pending: hiển thị rõ `Đang xin gia hạn — vẫn tính hạn cũ`, kể cả nếu đã quá hạn.
- Timeline hiển thị đơn lần 1/2/3, cả bản từ chối và hạn chấp thuận.

## J. Accessibility, UX chất lượng
- Font có hỗ trợ tiếng Việt, body 13–14px trở lên; tiêu đề trang 20–24px; line height đủ đọc; bảng nhiều nội dung cho phép dòng 2–3, tooltip phần còn lại.
- Không lạm dụng modal lồng modal; mọi hành động lưu/hủy có loading và feedback; confirm trước xóa/hủy.
- Màu cảnh báo không là tín hiệu duy nhất; click KPI đi được chi tiết; phản hồi tải dữ liệu, bảng rỗng, lỗi máy chủ và retry có thiết kế.
- Responsive 1366×768 không vỡ thanh filter; bảng cho cuộn ngang hợp lý; bàn phím Tab/Enter/Escape, nhãn có mô tả, tương phản tốt.
