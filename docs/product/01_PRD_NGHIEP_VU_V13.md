# ĐẶC TẢ NGHIỆP VỤ V1.3 — THEO DÕI NHIỆM VỤ UBND XÃ HƯƠNG ĐÔ

> Quy tắc nghiệp vụ V1.3 tiếp tục áp dụng. Riêng kiến trúc gợi ý cũ và phạm vi một cơ quan được [master Cloudflare đa Tenant](../cloudflare/MASTER_PROMPT.md) cập nhật: Worker API/D1/R2, Supabase chỉ cân nhắc cho Auth. Không apply PostgreSQL/SQL Server hoặc mặc định quyền ADMIN cũ cho mọi Tenant; xem [kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md).

## A. Mục đích, người dùng và ranh giới
- **Người hưởng lợi chính:** Lãnh đạo Văn phòng HĐND - UBND xã; xem nhanh nhiệm vụ, trách nhiệm đơn vị, các trường hợp cần đôn đốc/gia hạn.
- **Người cập nhật:** Cán bộ Văn phòng; nhập tay hoặc import Excel; ghi nhận báo cáo từ phòng ban qua kênh bên ngoài; cập nhật tiến độ, văn bản đôn đốc, đề nghị gia hạn, kết quả và tài liệu.
- **Người xác nhận hoàn thành:** Cán bộ Văn phòng được phân quyền hoặc Lãnh đạo Văn phòng; có nhật ký người xác nhận.
- **Đơn vị thực hiện:** 11 đơn vị trong danh mục; không đăng nhập và không bắt buộc cập nhật trực tiếp trong MVP.
- **Không thuộc MVP:** giao việc liên cơ quan có luân chuyển điện tử, chữ ký số, SSO, văn thư điện tử tích hợp, AI tóm tắt, ứng dụng mobile native, dự án/giải ngân/ngân sách.
- **Dữ liệu nguồn:** 3 phân loại cố định có thể cấu hình: `Nhiệm vụ tỉnh giao`, `Nhiệm vụ HĐND`, `Nhiệm vụ Kết luận cuộc họp`.

## B. Danh mục khởi tạo
### 11 đơn vị
1. Văn phòng HĐND - UBND
2. Phòng Kinh tế
3. Phòng Văn hóa - Xã hội
4. Trung tâm Phục vụ hành chính công
5. Ban Chỉ huy Quân sự xã Hương Đô
6. Công an xã Hương Đô
7. Điện lực Hương Khê
8. Trường Mầm non Hương Đô
9. Trung tâm dịch vụ tổng hợp
10. Trường TH&THCS Hương Đô
11. Trạm y tế xã Hương Đô

### 3 lãnh đạo
- Lê Hữu Đồng — Chủ tịch UBND xã
- Nguyễn Văn Luận — Phó Chủ tịch UBND xã
- Nguyễn Trung Thương — Phó Chủ tịch UBND xã

## C. Quy trình nghiệp vụ chuẩn
1. **Nhận nguồn giao:** Văn phòng tiếp nhận chỉ đạo tỉnh/HĐND/kết luận họp; nhập dữ liệu căn cứ (nếu có số ký hiệu, ngày ban hành, cơ quan ban hành, trích yếu, file).
2. **Tạo nhiệm vụ:** Mỗi đầu việc độc lập là một nhiệm vụ; gắn 1 nguồn, 1 đơn vị chủ trì, 0..n đơn vị phối hợp, 1 lãnh đạo chỉ đạo, 1 hạn gốc, nội dung, ưu tiên.
3. **Theo dõi:** Cán bộ Văn phòng bổ sung cập nhật ngày, nội dung thực hiện, mức độ tiến độ (tùy chọn), khó khăn, minh chứng.
4. **Cảnh báo:** Hệ thống tự tính theo hạn hiệu lực, hiện cảnh báo 3–5 ngày, 0–2 ngày hoặc quá hạn; không tự gửi văn bản ra ngoài.
5. **Đôn đốc:** Khi cần, Văn phòng lập bản ghi đôn đốc với số/ngày văn bản, người ký/đơn vị ban hành, nội dung và file; có thể chọn nhiều nhiệm vụ cùng văn bản.
6. **Xin gia hạn:** Văn phòng nhận đề nghị gia hạn và lưu số/ngày, lý do, hạn đề nghị, file; ghi nhận trạng thái chờ xem xét. Khi có văn bản chấp thuận hoặc không chấp thuận, nhập kết quả và file căn cứ. Chỉ bản ghi **được chấp thuận** mới làm thay đổi hạn hiệu lực.
7. **Hoàn thành:** Văn phòng ghi nhận ngày hoàn thành thực tế, nội dung kết quả, minh chứng; người có quyền xác nhận. Hệ thống xác định hoàn thành đúng hạn/chậm hạn theo hạn hiệu lực áp dụng cho nhiệm vụ.
8. **Báo cáo:** Tổng hợp theo đơn vị chủ trì/nguồn/lãnh đạo/tháng-năm, xuất Excel, truy vết văn bản và lịch sử.

## D. Dữ liệu một nhiệm vụ
| Nhóm | Trường | Quy tắc |
|---|---|---|
| Định danh | ID, mã nhiệm vụ hệ thống | ID bất biến, mã tự sinh; `mã đối chiếu` tùy chọn khi import |
| Nguồn | Nguồn nhiệm vụ | 1 trong 3 nguồn |
| Căn cứ | Số ký hiệu, ngày văn bản, cơ quan, trích yếu, file | Có thể liên kết 1 văn bản với nhiều nhiệm vụ; trường tài liệu bắt buộc theo cấu hình nghiệp vụ, không ép có số cho mọi kết luận miệng |
| Công việc | Nội dung nhiệm vụ, lĩnh vực, ngày giao, mức độ ưu tiên | Nội dung và ngày giao bắt buộc |
| Trách nhiệm | Đơn vị chủ trì, nhiều đơn vị phối hợp, lãnh đạo chỉ đạo, người theo dõi của Văn phòng | Một đơn vị chủ trì để tính thống kê; không nhập hai đơn vị chủ trì |
| Thời hạn | Ngày bắt đầu (tùy chọn), hạn gốc, hạn hiệu lực | Hạn gốc không ghi đè; hạn hiệu lực suy ra từ lần gia hạn cuối được chấp thuận |
| Tiến độ | Trạng thái thực hiện, %, cập nhật gần nhất, ghi chú, tệp kết quả | % tùy chọn, không tự coi 100% là hoàn thành nếu chưa xác nhận |
| Hoàn thành | Ngày hoàn thành thực tế, ngày xác nhận, người xác nhận, kết quả | Không được xác nhận hoàn thành khi thiếu ngày thực tế và kết quả |
| Nhật ký | Tạo lúc/ bởi ai, sửa lúc/bởi ai, lịch sử thay đổi | Không sửa không dấu vết, có lịch sử hoàn nguyên hợp lệ |

## E. Trạng thái và thuật toán
### E1. Trạng thái thực hiện (do người có quyền nhập)
- `CHUA_THUC_HIEN` — mới ghi nhận, chưa bắt đầu.
- `DANG_THUC_HIEN` — đang triển khai; Văn phòng ghi nhận tiến độ.
- `DA_HOAN_THANH` — đã có thông tin kết quả, ngày thực tế và xác nhận hợp lệ.
- **Không làm** trạng thái `CHO_PHE_DUYET_HOAN_THANH` ở MVP, vì phòng ban chưa nộp trực tuyến. Có thể mở rộng sau.

### E2. Trạng thái hạn (tự tính; áp dụng nhiệm vụ chưa hoàn thành)
Dùng múi giờ `Asia/Ho_Chi_Minh`, ngày lịch; hạn cuối cùng vẫn được coi là đúng hạn trong cả ngày đến hạn.
- `CON_HAN`: hạn hiệu lực - hôm nay > 5 ngày.
- `NGUY_CO_CHAM`: còn 3–5 ngày.
- `SAP_DEN_HAN_KHAN`: còn 0–2 ngày (0 = đến hạn hôm nay).
- `QUA_HAN`: hạn hiệu lực - hôm nay < 0 ngày.
- Với nhiệm vụ đã hoàn thành, không còn nhãn cảnh báo thời hạn; gắn **kết quả hoàn thành**: `HOAN_THANH_DUNG_HAN` hoặc `HOAN_THANH_CHAM_HAN`, so sánh ngày thực tế với hạn hiệu lực được chấp thuận.
- Nếu không có hạn hiệu lực thì báo dữ liệu chưa hợp lệ; trong MVP bắt buộc hạn gốc.

### E3. Trạng thái gia hạn (theo bản ghi có tài liệu)
- `KHONG_XIN`: chưa có đề nghị gia hạn.
- `DANG_XIN`: đã ghi nhận văn bản đề nghị, chưa có chấp thuận/từ chối.
- `DA_DUOC_GIA_HAN`: có văn bản chấp thuận hạn mới; áp dụng hạn mới.
- `KHONG_DUOC_CHAP_THUAN`: có kết quả từ chối; hạn hiệu lực không thay đổi.
- Nếu đã được gia hạn một lần rồi xin tiếp lần 2, trạng thái là `DANG_XIN` nhưng **hạn hiệu lực tiếp tục là hạn chấp thuận gần nhất**.
- Chỉ một đề nghị đang chờ tại mỗi thời điểm trên mỗi nhiệm vụ; cho phép lưu nhiều lần gia hạn tuần tự. Không xóa lịch sử lần cũ.

### E4. Cảnh báo không phải đôn đốc
- `NGUY_CO_CHAM`, `SAP_DEN_HAN_KHAN`, `QUA_HAN` là **nhãn cảnh báo tự động**.
- `DA_DON_DOC` không được thay thế cho `DANG_THUC_HIEN` hay `QUA_HAN`. Nhiệm vụ có thể bị đôn đốc 3 lần nhưng vẫn đang quá hạn.

## F. Nghiệp vụ văn bản đôn đốc
Form `Ghi nhận đôn đốc`:
1. Danh sách nhiệm vụ được đôn đốc: 1..n nhiệm vụ (cùng 1 văn bản có thể gửi nhiều nhiệm vụ).
2. Số/ký hiệu văn bản (*) — hoặc xác nhận loại ghi nhận nhắc việc nội bộ, không tính là đôn đốc có văn bản.
3. Ngày ban hành (*) và ngày gửi (nếu khác).
4. Đơn vị/cơ quan ban hành, người ký (tùy chọn).
5. Trích yếu, nội dung yêu cầu đôn đốc (*), hạn yêu cầu báo cáo (tùy chọn).
6. Tệp văn bản/đường dẫn tham chiếu; khuyến nghị bắt buộc tải bản scan/PDF với trường hợp đôn đốc có văn bản.
7. Người nhập, ngày nhập, ghi chú và nhật ký kiểm tra.

**Đếm số lần đôn đốc = số bản ghi đôn đốc có văn bản hợp lệ, không bị hủy, có liên kết đến nhiệm vụ**. Không tăng số lần chỉ vì mở form, sửa bản ghi hoặc tải lại cùng file. Một văn bản chung liên kết tới 4 nhiệm vụ làm mỗi nhiệm vụ có 1 lần đôn đốc. Không tự tạo văn bản. Các lần `nhắc việc nội bộ` (nếu bật) đếm ở chỉ tiêu khác.

Khi nhiều lần đôn đốc, chi tiết nhiệm vụ phải hiển thị timeline: `Lần 1 — ngày — số VB`, `Lần 2 — ngày — số VB`,... và link xem file.

## G. Nghiệp vụ xin gia hạn
Form `Thêm đề nghị gia hạn`:
- Số/ký hiệu văn bản đề nghị (*), ngày đề nghị (*), đơn vị đề nghị (*), lý do (*), **hạn đề xuất mới (*)**, file đính kèm (* trong cấu hình mặc định).
- Tự hiển thị **Hạn gốc**, **Hạn hiệu lực hiện tại**, **Số ngày xin gia hạn** (khoảng ngày giữa hạn đề xuất và hạn hiệu lực hiện tại).
- Nút `Lưu đề nghị`: trạng thái `DANG_XIN`; không được sửa hạn đang sử dụng để cảnh báo.
- Tab `Kết quả xem xét`: `Chấp thuận` / `Không chấp thuận`, số văn bản phản hồi, ngày phản hồi, người/cơ quan ký, file. Nếu chấp thuận, nhập `Hạn được chấp thuận` (có thể khác hạn đề xuất), cập nhật hạn hiệu lực, giữ nguyên hạn gốc.
- Nếu từ chối, hạn hiệu lực giữ nguyên; nhiệm vụ tiếp tục được cảnh báo trên hạn hiện tại.
- Đề nghị hạn mới phải lớn hơn hạn hiệu lực đang áp dụng (trường hợp đặc biệt điều chỉnh giảm hạn là một nghiệp vụ khác, không thuộc form gia hạn).
- Lưu toàn bộ lịch sử xin gia hạn và văn bản phản hồi; không cho xóa vật lý sau khi có kết quả.

## H. Nhập Excel
**Có workbook mẫu**: `Mau_Import_NhiemVu_UBND_HuongDo_v1_3.xlsx` gồm 4 sheet. Chỉ import sheet `NHAP_NHIEM_VU`, header ở dòng 5, dữ liệu từ dòng 6; `VI_DU` và `DANH_MUC` không import.

Luồng: `Tải mẫu → Điền Excel → Chọn tệp .xlsx → Đọc & chuẩn hóa → Xem trước → Hiển thị lỗi theo dòng/cột → Người dùng xác nhận → Ghi DB theo lô → Trả kết quả + nhật ký`.

**Kiểm tra bắt buộc:** Nguồn thuộc danh mục; ngày hợp lệ; nội dung không rỗng; có chủ trì và lãnh đạo hợp lệ; hạn gốc không trước ngày giao (nếu ngoại lệ phải được duyệt); trạng thái hợp lệ; nếu đã hoàn thành phải có ngày thực tế + kết quả. Đơn vị phối hợp tách bằng `|`, tên chính xác theo danh mục, không trùng chủ trì.

**Chống trùng:** Ưu tiên `Mã đối chiếu` duy nhất từ Excel; nếu thiếu, cảnh báo các dòng có cùng nguồn + số VB/ngày VB + nội dung + đơn vị chủ trì. Hiển thị lựa chọn `Bỏ qua trùng` / `Cập nhật bản ghi` (chỉ khi định danh chắc chắn) / `Tạo mới`, mặc định `Bỏ qua`; không cập nhật dữ liệu âm thầm.

**Nhập an toàn:** Không đưa tài liệu đính kèm vào Excel; dùng màn hình chi tiết để đính kèm sau; xử lý tất cả dòng qua bước xem trước và xác nhận; nếu lỗi chặn thì không import một phần ngoài ý muốn; ghi nhật ký tên file, người nhập, thời điểm, thành công/thất bại.

## I. KPI và thống kê
- **Tổng nhiệm vụ:** Đếm ID nhiệm vụ duy nhất trong bộ lọc.
- **Đã hoàn thành:** Đếm `DA_HOAN_THANH`; phân tách đúng hạn/chậm hạn (hai nhóm con, không cộng lặp).
- **Chưa hoàn thành:** Chưa thực hiện + Đang thực hiện.
- **Có nguy cơ:** Các nhiệm vụ chưa hoàn thành còn 3–5 ngày.
- **Khẩn:** Các nhiệm vụ chưa hoàn thành còn 0–2 ngày.
- **Quá hạn:** Các nhiệm vụ chưa hoàn thành có hạn hiệu lực trước hôm nay.
- **Đang xin gia hạn:** Nhiệm vụ có đề nghị chờ xem xét; nhóm này có thể trùng nhóm quá hạn, KHÔNG cộng vào tổng như một nhóm độc lập.
- **Đã đôn đốc:** Đếm nhiệm vụ có ít nhất 1 bản ghi đôn đốc hợp lệ; **Tổng lượt đôn đốc** đếm tất cả bản ghi liên kết.
- **Thống kê theo đơn vị:** chỉ đếm nhiệm vụ mà đơn vị là chủ trì; cho phép bộ lọc riêng `Đơn vị phối hợp` để tra cứu nhưng không cộng trùng vào tổng.
- KPI click mở danh sách nhiệm vụ đúng với bộ lọc hiện tại (năm, nguồn, đơn vị, lãnh đạo).

## J. Giao diện tối thiểu
- Header đơn giản: UBND xã Hương Đô — Theo dõi nhiệm vụ; tên tài khoản; thông báo.
- 5 trang: (1) Tổng quan, (2) Danh sách nhiệm vụ, (3) Cần đôn đốc, (4) Báo cáo theo đơn vị, (5) Danh mục/cấu hình.
- Trang danh sách có `Thêm nhiệm vụ`, `Import Excel`, `Tải mẫu`, `Xuất Excel`. Bộ lọc nguồn, lãnh đạo, đơn vị chủ trì, trạng thái thực hiện, hạn, gia hạn và từ khóa.
- Drawer chi tiết có các tab: `Thông tin` | `Tiến độ` | `Đôn đốc` | `Gia hạn` | `Lịch sử`.
- Mở nhiệm vụ từ mọi KPI, bảng và thống kê; không dùng số liệu mẫu trong chế độ dữ liệu thật.

## K. Kiến trúc gợi ý
- Frontend: React + TypeScript + Ant Design + Recharts, tham khảo các component từ https://github.com/ntuan161297-eng/VanPhongSo (không sao chép dự án/giải ngân/ngân sách và dữ liệu mock tỉnh).
- Backend ưu tiên: ASP.NET Core Web API + EF Core + SQL Server; UI truy cập API thực. Nếu chưa có SQL Server, có thể dùng SQLite ở môi trường thử nghiệm nhưng phải thiết kế migration rõ.
- Bảng tối thiểu: `Units`, `Leaders`, `TaskSources`, `SourceDocuments`, `Tasks`, `TaskCoordinatingUnits`, `TaskProgressUpdates`, `ExpediteDocuments`, `ExpediteDocumentTasks`, `ExtensionRequests`, `Attachments`, `Users`, `AuditLogs`, `ImportJobs`, `ImportJobRows`.
- File lưu có đường dẫn được kiểm soát, kiểm tra định dạng/kích thước, bảo vệ truy cập; không để file tùy ý dưới thư mục public. Auth/role ở backend.

## L. Quyền truy cập (MVP)
| Vai trò | Xem | Nhập/sửa | Đôn đốc | Gia hạn | Xác nhận xong | Cấu hình |
|---|---|---|---|---|---|---|
| Lãnh đạo Văn phòng | Có | Có thể phân quyền | Xem/lập | Xem/ghi nhận quyết định | Có | Không mặc định |
| Chuyên viên Văn phòng | Có | Có | Ghi nhận | Nhập đề nghị/kết quả theo quyền | Theo quyền | Không |
| Quản trị | Có | Quản trị dữ liệu | Theo phân quyền | Theo phân quyền | Theo phân quyền | Có |

**Quan trọng:** Ghi nhận `được chấp thuận` chỉ khi có tài liệu chấp thuận của người/cơ quan có thẩm quyền. Phần mềm không mặc định Văn phòng có thẩm quyền tự gia hạn nhiệm vụ tỉnh giao/HĐND giao.

## M. Nguyên tắc nghiệm thu
Một nhiệm vụ có thể được tạo tay hoặc import Excel, hiển thị cùng dữ liệu ở danh sách và Dashboard; cảnh báo đổi khi hạn còn 5/2/0/-1 ngày; đôn đốc có đầy đủ văn bản làm tăng số lần đúng một; xin gia hạn đang chờ không làm đổi hạn; gia hạn được chấp thuận mới đổi hạn; mọi lần đều có nhật ký và file; thống kê khớp danh sách sau lọc; thoát đăng nhập rồi vào lại vẫn giữ dữ liệu.
