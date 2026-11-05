# MASTER PRD — PHẦN MỀM THEO DÕI, ĐÔN ĐỐC NHIỆM VỤ UBND XÃ HƯƠNG ĐÔ

**Phiên bản:** 1.2 / Đầu mối nghiệp vụ: Văn phòng HĐND–UBND xã / Trạng thái: đặc tả để dựng MVP.  
**Định nghĩa MVP:** làm được nghiệp vụ từ đầu đến cuối với dữ liệu bền vững, có tra cứu, có cảnh báo, có báo cáo đơn vị và phân quyền.

## 1. Vấn đề và kết quả cần đạt
Văn phòng tiếp nhận nhiều nhiệm vụ từ văn bản chỉ đạo và thông báo kết luận; nội dung được giao rải ở nhiều nguồn, dễ bỏ sót hạn, khó xác định đơn vị chịu trách nhiệm và khó tổng hợp số liệu cho lãnh đạo. Mỗi sáng, cán bộ cần biết: *còn việc nào, ai chủ trì, hạn nào nguy hiểm, đã đôn đốc lần nào, và lãnh đạo cần chỉ đạo việc gì*.

**Kết quả tối thiểu:** trong 1 màn hình tổng quan nhìn thấy 5 nhóm chính; tìm được từng nhiệm vụ bằng 2–3 thao tác; tạo/cập nhật/hoàn thành được nhiệm vụ; xem thống kê đủ 11 đơn vị; tải báo cáo Excel theo đúng bộ lọc.

## 2. Người dùng / ranh giới thẩm quyền
| Vai trò | Quyền | Không làm |
|---|---|---|
| Văn phòng — cán bộ theo dõi | Xem, tạo, sửa, cập nhật tiến độ, ghi nhận đôn đốc, ghi nhận đề xuất hoàn thành | Không quản trị tài khoản hệ thống nếu không là admin |
| Văn phòng — người có quyền xác nhận | Tất cả quyền cán bộ + xác nhận hoàn thành, sửa thời hạn có lý do | Không thể xóa vết thời gian hoặc nhật ký |
| Lãnh đạo UBND xã | Xem Dashboard, danh sách, báo cáo và chi tiết; lọc theo chỉ đạo của mình | Không tự sửa nhiệm vụ trong MVP |
| Admin nội bộ | Quản lý người dùng, danh mục, cấu hình | Không được xóa nhật ký audit |

Các **đơn vị được giao nhiệm vụ chỉ là danh mục theo dõi**, không có tài khoản đăng nhập bản đầu. Nghiệp vụ xác nhận hoàn thành thuộc Văn phòng, không tự động công nhận dựa trên việc đơn vị gửi văn bản.

## 3. Danh mục cố định làm seed, nhưng chỉnh sửa được
**Nguồn nhiệm vụ (chỉ 3):** `TINH_GIAO` (Nhiệm vụ tỉnh giao); `HDND` (Nhiệm vụ HĐND); `KET_LUAN_CUOC_HOP` (Nhiệm vụ Kết luận cuộc họp).

**Lãnh đạo chỉ đạo:** Lê Hữu Đồng — Chủ tịch UBND xã; Nguyễn Văn Luận — Phó Chủ tịch UBND xã; Nguyễn Trung Thương — Phó Chủ tịch UBND xã. Đây là danh mục chỉ đạo, không mặc nhiên là tài khoản đăng nhập.

**11 đơn vị:** Văn phòng HĐND - UBND; Phòng Kinh tế; Phòng Văn hóa - Xã hội; Trung tâm Phục vụ hành chính công; Ban Chỉ huy Quân sự xã Hương Đô; Công an xã Hương Đô; Điện lực Hương Khê; Trường Mầm non Hương Đô; Trung tâm dịch vụ tổng hợp; Trường TH&THCS Hương Đô; Trạm y tế xã Hương Đô. Dùng dữ liệu `seed/` làm chuẩn, không tự đổi tên cơ quan.

## 4. Mô hình nghiệp vụ trong MVP
```
Văn bản chỉ đạo / Thông báo kết luận
              ↓
Văn phòng tạo hồ sơ căn cứ (có thể tạo N nhiệm vụ từ cùng một hồ sơ)
              ↓
Văn phòng nhập 1 nhiệm vụ: nội dung + nguồn + 1 đơn vị chủ trì + hạn + lãnh đạo
              ↓
Chưa thực hiện → Đang thực hiện → Xác nhận hoàn thành tại Văn phòng
       ↘ Ghi tiến độ / Ghi đôn đốc / Điều chỉnh hạn có lý do ↗
              ↓
Bảng thống kê theo đơn vị + số ngày còn/quá + lịch sử
```
**Tối giản phê duyệt:** Không làm công đoạn 'đơn vị gửi trên hệ thống → Văn phòng duyệt' vì đơn vị chưa có tài khoản. Văn phòng kiểm tra ngoài hệ thống, nhập ngày hoàn thành thực tế và bấm **Xác nhận hoàn thành**, hệ thống lưu `completed_date`, `confirmed_at`, `confirmed_by`, kết quả và minh chứng. Có thể mở rộng trạng thái chờ duyệt sau.

## 5. Phạm vi phát triển: 5 màn hình + đăng nhập
**M1. Đăng nhập**: xác thực thật ở giai đoạn backend; role-based access. Không để tài khoản demo ở hệ thống thật.

**M2. Dashboard — Tổng quan & Cảnh báo**: bộ lọc năm/nguồn/đơn vị/lãnh đạo; 6 KPI (Tổng, Đã hoàn thành, Đang theo dõi, Nguy cơ 3–5, Sắp đến hạn 0–2, Quá hạn); hàng 'Cần đôn đốc hôm nay'; biểu đồ cơ cấu đơn giản; Top đơn vị tồn đọng; mọi số bấm drill-down đến danh sách.

**M3. Danh sách nhiệm vụ**: tìm nhanh; lọc nguồn/đơn vị/lãnh đạo/thực hiện/hạn/ngày; sắp xếp ưu tiên quá hạn; phân trang; nút Thêm nhiệm vụ; xuất Excel tập dữ liệu đã lọc; xem chi tiết, sửa, cập nhật, đôn đốc.

**M4. Thêm/Sửa/Chi tiết nhiệm vụ**: chia nhóm 'Thông tin giao' / 'Phân công & thời hạn' / 'Theo dõi & kết quả' / 'Lịch sử & tài liệu'. Nút nhập có trường tối thiểu; chi tiết mở drawer lớn hoặc trang riêng phù hợp desktop. Không bắt nhập 20 trường trước khi lưu.

**M5. Tổng hợp theo đơn vị**: đủ 11 dòng kể cả 0; các cột Tổng / Hoàn thành / Hoàn thành chậm / Đang theo dõi / Nguy cơ / Sắp đến hạn / Quá hạn; click số mở danh sách đã lọc; xuất Excel.

**M6. Danh mục & cấu hình gọn**: 11 đơn vị, 3 lãnh đạo, 3 nguồn; bật/tắt đơn vị; ngưỡng cảnh báo mặc định 3–5 / 0–2 ngày theo ngày lịch; cấu hình người dùng nếu có backend.

## 6. Trường nhập công việc
**Bắt buộc để lưu:** Nội dung nhiệm vụ; nguồn nhiệm vụ; đơn vị chủ trì; ngày giao; hạn hoàn thành (MVP mặc định bắt buộc); mô tả căn cứ (số văn bản hoặc tên cuộc họp). Mã do hệ thống sinh. `ngày giao <= hạn hoàn thành` (trừ import lịch sử đã được kiểm soát).

**Tùy chọn:** tên ngắn; lãnh đạo chỉ đạo; đơn vị phối hợp; mức ưu tiên (Thường/Cao/Khẩn); số/ký hiệu; ngày ban hành hoặc ngày họp; cơ quan ban hành; trích yếu; file căn cứ; chuyên viên Văn phòng theo dõi; ghi chú.

**Theo dõi:** trạng thái thực hiện, ngày cập nhật, nội dung cập nhật tiến độ, khó khăn, ghi nhận đôn đốc (ngày/kênh/nội dung/đầu mối), lịch sử gia hạn, kết quả hoàn thành và chứng cứ.

**Quan hệ:** Một căn cứ có thể sinh nhiều nhiệm vụ; một nhiệm vụ có một nguồn chính; nhiệm vụ có đúng một đơn vị chủ trì; nhiều đơn vị phối hợp tùy chọn. Không tạo nhiều bản sao nhiệm vụ chỉ vì thêm đơn vị phối hợp.

## 7. Những gì CHƯA làm ở MVP
- Không sao chép các module Dự án trọng điểm, Giải ngân, Ngân sách, Bản đồ tỉnh.
- Không app mobile native, chat nội bộ, Zalo API, email/SMS, AI phân tích, eSign, workflow đa cấp, biểu đồ 3D, so sánh 6 tháng giả lập.
- Không yêu cầu phòng chuyên môn/đơn vị trường học đăng nhập hay cập nhật tiến độ.
- Không xây quản lý đầu việc con, quy trình nhiều bước phức tạp, tiến độ % khi chưa có định nghĩa.
- Không nhập tự động văn bản từ hệ thống văn bản khác ở bản đầu; file chỉ đính kèm hoặc nhập tay.
- Không dùng biểu đồ hoặc số liệu giả làm kết quả nghiệp vụ thật.

## 8. Các điều kiện thành công
(1) Lưu/sửa/tìm được dữ liệu sau restart; (2) cảnh báo ngày đúng; (3) thống kê đúng và không đếm trùng; (4) không mất lịch sử; (5) phân quyền được kiểm tra tại backend; (6) không cần đào tạo phức tạp để nhập và tra cứu; (7) giao diện đẹp, đọc được trên 1366px, dùng được trên tablet; (8) báo cáo Excel khớp bảng lọc.

## 9. Một số quyết định thiết kế (chưa phải quy định hành chính)
- Cảnh báo tính theo **ngày lịch** tại Việt Nam; chưa cộng ngày lễ, ngày nghỉ.
- Cho phép người dùng Văn phòng có quyền xác nhận kết quả ngay trong màn hình chi tiết, không tạo workflow phê duyệt riêng.
- Nếu tương lai có nhiệm vụ chưa xác định hạn, bổ sung ngoại lệ `NO_DEADLINE`; bản cơ bản yêu cầu hạn để kiểm soát tốt hơn.
- Khi có điều chỉnh hạn, lưu hạn ban đầu và toàn bộ phiên bản; dùng hạn được chấp thuận hiện hành cho cảnh báo, báo cáo gia hạn riêng.
