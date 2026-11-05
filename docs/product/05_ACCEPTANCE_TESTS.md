# TIÊU CHÍ NGHIỆM THU MVP — TEST CÓ THỂ THỰC THI

**Quy tắc chung:** không nghiệm thu dựa vào ảnh chụp UI đẹp. Phải có test dữ liệu thật + backend/API + UI tương tác. Khi thử thời gian, inject `businessDate` hoặc service clock để kiểm thử ổn định.

| ID | Kịch bản | Kết quả phải đạt |
|---|---|---|
| T01 | Seed hệ thống | Đúng 11 đơn vị, 3 nguồn, 3 lãnh đạo; không tự tạo người dùng cho đơn vị |
| T02 | Tạo nhiệm vụ thiếu nội dung/nguồn/đơn vị/hạn | Chặn lưu, báo lỗi cạnh trường |
| T03 | Tạo 3 nhiệm vụ từ cùng 1 văn bản | 1 hồ sơ, 3 task, Dashboard tổng +3 |
| T04 | Nhiệm vụ Kết luận cuộc họp chưa có số ký hiệu | Có thể nhập tên cuộc họp & ngày họp, không bắt số văn bản |
| T05 | Chọn đơn vị chủ trì và 2 phối hợp | Tổng theo chủ trì tăng 1; đơn vị phối hợp không tăng tổng |
| T06 | Nhiệm vụ chưa hoàn thành, hạn hôm nay+6 | Còn hạn / không ở danh sách Nguy cơ |
| T07 | Hạn hôm nay+5, +4, +3 | Nguy cơ chậm hạn |
| T08 | Hạn hôm nay+2, +1, hôm nay | Sắp đến hạn 0–2, vẫn chưa quá hạn |
| T09 | Hạn hôm qua | Quá hạn, số ngày quá 1 |
| T10 | Hoàn thành thực tế ngày hạn, Văn phòng xác nhận ngày hôm sau | Hoàn thành đúng hạn, không ở quá hạn chưa hoàn thành |
| T11 | Hoàn thành thực tế một ngày sau hạn | Hoàn thành chậm, không còn ở danh sách quá hạn hiện hành |
| T12 | Thay hạn trước khi hoàn thành | `original_due_date` giữ nguyên, ghi old/new/reason/who/when, báo cáo áp dụng hạn hiện hành |
| T13 | Sau hoàn thành có thay hạn ở hệ thống | `due_date_at_completion` giữ snapshot; không đổi lại loại kết quả lịch sử |
| T14 | Tạo nhiệm vụ, ghi tiến độ, đôn đốc, hoàn thành | Nhật ký có đủ sự kiện, không xóa, đúng thứ tự thời gian |
| T15 | Lọc Nguồn=HĐND, đơn vị=Phòng Kinh tế, leader=Lê Hữu Đồng | Điều kiện AND đúng; tổng card và bảng lọc thống nhất |
| T16 | Bấm ô Quá hạn của đơn vị trong báo cáo | Danh sách mở đúng đơn vị và nhóm quá hạn, số bản ghi = ô đã bấm |
| T17 | Một đơn vị không có nhiệm vụ trong kỳ | Vẫn hiện 1 dòng toàn số 0 |
| T18 | Xuất Excel khi lọc | Sheet tổng và chi tiết đúng tập lọc, Unicode tiếng Việt, số liệu khớp UI |
| T19 | Người xem lãnh đạo gọi API POST/PATCH trực tiếp | Server từ chối 403, không thay đổi dữ liệu |
| T20 | Văn phòng editor gọi API xác nhận hoàn thành | Từ chối nếu thiếu quyền `OFFICE_CONFIRMER` |
| T21 | Reload trình duyệt/restart server | Nhiệm vụ và nhật ký vẫn còn trong DB |
| T22 | Hai phiên sửa cùng nhiệm vụ | Concurrency check, không âm thầm ghi đè |
| T23 | Đưa ngày hiện tại qua ranh giới nửa đêm Việt Nam | Nhãn hạn thay đúng mà không phụ thuộc UTC máy người dùng |
| T24 | Giao diện 1366px, 768px, 375px | Không vỡ layout; nút chính dùng được; bảng cuộn ngang trên màn nhỏ |
| T25 | Không có dữ liệu hoặc API lỗi | Có empty/error state, không giả số 0 là thành công khi mất kết nối |
| T26 | Dùng keyboard Tab/Enter/Escape | Form, filter, drawer, button hoạt động; focus rõ |
| T27 | Dữ liệu thật | Không có tên tỉnh Hưng Yên, dữ liệu demo/ảnh tỉnh bị lẫn vào bản Hương Đô |
| T28 | Chạy build/lint/tests | Không lỗi mức chặn trước khi phát hành |
| T29 | Backup và restore test | Phục hồi dữ liệu 3 nhiệm vụ thử + nhật ký từ bản sao lưu |
| T30 | Mở URL download file không có quyền | 401/403; file không public qua đường dẫn tĩnh |

## Kiểm tra số liệu bằng một bộ mẫu dễ đối chiếu
Tạo 8 nhiệm vụ cho một đơn vị, trong cùng kỳ: 2 hoàn thành đúng hạn; 1 hoàn thành chậm; 1 đang làm còn 8 ngày; 1 đang làm còn 4 ngày; 1 đang làm còn 1 ngày; 2 đang làm quá hạn. Kỳ vọng: **Tổng 8; hoàn thành 3; hoàn thành chậm 1; đang theo dõi 5; nguy cơ 1; sắp đến hạn 1; quá hạn 2.** Không được cộng các cột con để ra tổng 8.

## Định nghĩa hoàn tất giai đoạn
- **UI approved**: người dùng nhìn bản mẫu và xác nhận nhãn, bố cục, tương tác, không có module thừa.
- **Business approved**: qua T01–T18 & T23 trên data test, có seed và quy tắc phù hợp.
- **Ready for real use**: qua T19–T30, có xác thực thật, sao lưu và xử lý lỗi.
