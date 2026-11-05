# UI/UX BLUEPRINT — NGHIỆP VỤ RÕ, THẨM MỸ HÀNH CHÍNH HIỆN ĐẠI

## 1. Hướng thiết kế
**Visual reference:** screenshot 'Văn Phòng Số tỉnh Hưng Yên' do Product Owner gửi; repository `https://github.com/ntuan161297-eng/VanPhongSo`. Chỉ lấy phong cách header navy, menu ngang, card KPI, bộ lọc, bảng và biểu đồ; KHÔNG sao chép tên Hưng Yên/logo/khu vực/dữ liệu/chức năng ngoài phạm vi.

**Tên giao diện:** `THEO DÕI NHIỆM VỤ | UBND XÃ HƯƠNG ĐÔ`. Slogan ngắn: `Theo dõi tiến độ • Chủ động đôn đốc`. Dùng icon trung tính; logo pháp lý của cơ quan chỉ xuất hiện nếu có tệp được cơ quan phê duyệt.

**4 nguyên tắc:** (1) thông tin quan trọng trong 1 màn hình; (2) số liệu là điểm vào danh sách thực tế; (3) nhập ít, tìm nhanh; (4) trạng thái có chữ + màu, không chỉ màu.

## 2. Thiết kế điều hướng (KHÔNG sidebar lớn)
- Header cao ~64px: bên trái icon + `UBND XÃ HƯƠNG ĐÔ / THEO DÕI NHIỆM VỤ`; phải ô tìm nhanh, chuông cảnh báo (chỉ nếu có dữ liệu), hồ sơ cá nhân.
- Navigation ngang cao ~44px: **Tổng quan** | **Danh sách nhiệm vụ** | **Tổng hợp đơn vị** | **Danh mục**; trên mobile thành menu gọn.
- Nội dung `max-width: 1600px`, margin 20–24px; nền app xám xanh rất nhạt, card trắng.
- Không tạo menu con lồng sâu. Header không vượt quá 2 hàng trên desktop.

## 3. Màn hình Tổng quan (ưu tiên nhất)
**Desktop 1440px — bố cục khuyến nghị:**
```
[ HEADER: UBND XÃ HƯƠNG ĐÔ     Tìm nhiệm vụ...     Thông báo     Tài khoản ]
[ Tổng quan ] [ Danh sách nhiệm vụ ] [ Tổng hợp đơn vị ] [ Danh mục ]

 Tổng quan nhiệm vụ                                  [+ Thêm nhiệm vụ] [Xuất báo cáo]
 Thống kê và cảnh báo tiến độ nhiệm vụ được giao
 [Năm 2026 v] [Nguồn: Tất cả v] [Đơn vị: Tất cả v] [Lãnh đạo: Tất cả v] [Xóa lọc]

 [Tổng 124] [Hoàn thành 37] [Đang theo dõi 87] [Nguy cơ 12] [Sắp hạn 9] [Quá hạn 28]

 [Danh sách cần đôn đốc hôm nay (bảng ~2/3)]   [Cơ cấu tình hình / donut (~1/3)]
 [Mã | Nội dung | Đơn vị | Hạn | Cảnh báo]      [Bảng chú giải; tỷ lệ]

 [Tổng hợp 11 đơn vị - bảng đủ dòng, có drill-down]
```
**Thứ tự ưu tiên:** KPI > việc cần đôn đốc > theo đơn vị > biểu đồ phụ. Không dùng banner cao quá 150px như giao diện tỉnh; ẩn ảnh minh họa để tập trung tác nghiệp. Khi có nhiều nhiệm vụ, giữ danh sách ưu tiên trên cùng.

**KPI:** Tổng được giao / Hoàn thành / Đang theo dõi / Nguy cơ chậm hạn 3–5 ngày / Sắp đến hạn 0–2 ngày / Quá hạn. Cảnh báo là tập con của `Đang theo dõi`; không cộng 6 KPI với nhau. Click mỗi card mở List với cùng bộ lọc.

## 4. Màn hình Danh sách nhiệm vụ
- Toolbar: tiêu đề, số bản ghi, [+ Thêm nhiệm vụ], [Xuất Excel].
- Bộ lọc nhanh luôn hiện: ô tìm kiếm (mã, nội dung, số ký hiệu); **Nguồn**, **Đơn vị chủ trì**, **Trạng thái thời hạn**, **Năm**. Nút [Bộ lọc nâng cao] mở thêm Lãnh đạo/Ngày giao/Trạng thái thực hiện/Mức ưu tiên.
- Khi đã lọc, hiện các chip điều kiện dễ xóa và nút `Đặt lại`.
- Table desktop: Mã/Nội dung; Nguồn; Đơn vị chủ trì; Lãnh đạo; Ngày giao; Hạn; Trạng thái thực hiện; Cảnh báo; thao tác.
- Content dài **tối đa 2 dòng**, phần còn lại qua tooltip/drawer; không nhồi 15 cột.
- Mặc định sắp xếp chưa hoàn thành: quá hạn → khẩn 0–2 → nguy cơ 3–5 → còn hạn, rồi deadline tăng dần. Phân trang 20/50.
- Mỗi dòng có hành động rõ: `Xem` (mở drawer), `Cập nhật`, menu `…` để Sửa/Đôn đốc/Xác nhận (theo quyền).
- Sau khi lọc có 0 bản ghi: trạng thái rỗng có nút `Xóa bộ lọc`, không để bảng trắng.

## 5. Màn hình Thêm nhiệm vụ / Chi tiết
- Thêm mới: trang có form tối đa 2 cột, các trường theo nhóm. Tab không quá 3 để tránh phân mảnh; không cần sơ đồ quy trình rườm rà.
  - A. Nội dung & nguồn: Nội dung (full width), Nguồn (3), hồ sơ căn cứ (loại/số/ngày/trích yếu/tệp).
  - B. Phân công: Đơn vị chủ trì (11), Đơn vị phối hợp (multi), Lãnh đạo (3), ưu tiên.
  - C. Thời hạn: Ngày giao, hạn hoàn thành; ghi chú.
- Footer sticky: `Hủy` | `Lưu nhiệm vụ` (primary). Lưu xong trở về chi tiết với thông báo rõ.
- Chi tiết nên dùng drawer rộng 760–900px hoặc trang chi tiết 2 cột: khối thông tin tóm tắt đầu; các tab `Thông tin`, `Nhật ký tiến độ & đôn đốc`, `Kết quả & tài liệu`.
- `Xác nhận hoàn thành`: pop-up có ngày hoàn thành thực tế, nội dung kết quả, tài liệu (nếu có), xác nhận rõ; không nhầm ngày hoàn thành thực tế với `confirmed_at`.
- `Điều chỉnh hạn`: nhập hạn mới + lý do, hiển thị hạn cũ; không ghi đè lịch sử.
- Không tạo trạng thái hoàn thành chỉ vì nhập `% tiến độ = 100`.

## 6. Màn hình Tổng hợp theo đơn vị
- Bộ lọc dùng chung với Dashboard; 11 dòng luôn có, kể cả số 0.
- Header cột: `Đơn vị | Tổng | Đã hoàn thành | HT chậm | Đang theo dõi | Nguy cơ 3–5 | Khẩn 0–2 | Quá hạn`.
- Mỗi ô số là link drill-down. Một dòng có thể có số ở nhiều cột **vì các cảnh báo là tập con**, có tooltip giải thích. Dòng tổng toàn xã dựa `DISTINCT task.id`.
- Trên màn hình hẹp, cho cuộn ngang bảng với 1–2 cột đầu sticky; không nén chữ thành khó đọc.
- Nút `Xuất Excel` tạo workbook có tiêu đề, ngày giờ xuất, bộ lọc áp dụng; sheet `TongHopDonVi` + `ChiTietNhiemVu`.

## 7. Token thiết kế / a11y
| Token | Khuyến nghị |
|---|---|
| Header navy | `#143653` hoặc gần màu ở repository reference |
| Primary blue | `#1677FF` / `#1672D3` |
| Nền app | `#F4F7FB` |
| Surface | `#FFFFFF` |
| Border | `#E5EAF1` |
| Chữ chính | `#16253A` |
| Chữ phụ | `#64748B` |
| Hoàn thành | `#16A36B` kèm text |
| Nguy cơ | `#E9A008` kèm text |
| Sắp đến hạn | `#E87816` kèm text |
| Quá hạn | `#DD3D3D` kèm text |
| Bo góc | 10–12px card, 8px control |
| Spacing | bội 4px; bố cục 8 / 12 / 16 / 24px |
| Typography | `Segoe UI`, `Inter`, sans-serif; body 14px; bảng 13–14px; tiêu đề 22–24px; KPI 28–32px |

**Chất lượng:** input chiều cao 36–40px; label thật (không chỉ placeholder); tab rõ active; nút chính chỉ 1 mỗi khu vực; vùng click >= 36px; focus keyboard rõ; tooltip giải thích trạng thái; loading/skeleton, empty/error/success; contrast tốt; không lạm dụng gradient; tôn trọng `prefers-reduced-motion`.

**Responsive:** >= 1280px: 6 KPI / một hàng nếu đủ chỗ; 768–1279px: 3 KPI/hàng; <768px: 2 KPI/hàng, filter collapse, bảng horizontal scroll. Không hiển thị tên leader đầy đủ trong header mobile.

## 8. Hành vi phải hoạt động (KHÔNG UI rỗng)
- Filter thật sự thay đổi cards/bảng/list; reset về mặc định; lưu state khi drill-down và trở lại.
- Click KPI/ô tổng hợp phải mở list đúng điều kiện; click hàng mở chi tiết có thông tin thực.
- Form validation lỗi gần trường; không dùng alert browser mặc định.
- Export phản ánh **đúng tập lọc**; số trên dashboard cập nhật sau thao tác thêm/sửa/xác nhận.
- Bản dựng giao diện đầu tiên được phép dùng mock nhưng luôn hiển thị nhãn `DỮ LIỆU MINH HỌA`; không hứa có dữ liệu thật.

## 9. Anti-pattern cần tránh
1. Sao chép nguyên giao diện tỉnh bao gồm 4 hợp phần, 3 chế độ Dashboard, địa bàn và banner lớn.
2. Bảng thống kê nhồi 12+ cột không responsive.
3. Thẻ KPI số đẹp nhưng không click được hoặc số hard-code.
4. Mọi trạng thái đều một enum khiến vừa quá hạn vừa đang thực hiện không biểu diễn được.
5. Trên Dashboard bấm `Làm mới` nhưng không cập nhật ngày tham chiếu hoặc dữ liệu từ backend.
6. Xuất Excel không khớp bộ lọc hoặc nhầm đơn vị phối hợp là chủ trì.
