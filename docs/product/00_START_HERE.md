# BẮT ĐẦU Ở ĐÂY — THEO DÕI NHIỆM VỤ UBND XÃ HƯƠNG ĐÔ

**Bản đặc tả ưu tiên:** MVP v1.2, ngày 04/11/2026.  
**Mục tiêu:** một sản phẩm Web tối giản nhưng dùng thật; giao diện trực quan kiểu Văn Phòng Số; Văn phòng UBND xã là đầu mối duy nhất tạo/cập nhật/xác nhận nhiệm vụ.

## Cách sử dụng cùng Antigravity
1. Mở **thư mục dự án MỚI** (không chỉnh sửa repository `ntuan161297-eng/VanPhongSo` đang có).
2. Đặt bộ tài liệu này vào thư mục `docs/product/` của dự án mới.
3. Gửi nội dung `prompts/PROMPT_00_ANALYZE_FIRST.md` cho Agent. **Không cho code ngay**.
4. Kiểm tra kế hoạch, mô hình dữ liệu, sơ đồ điều hướng và các giả định nghiệp vụ.
5. Gửi `prompts/PROMPT_01_UI_FIRST.md`: dựng frontend mẫu có dữ liệu demo, xem trực quan trước.
6. Khi giao diện được duyệt, dùng `PROMPT_02_REAL_DATA.md` nối API + SQL Server; cuối cùng `PROMPT_03_QA.md`.

## Tài liệu ưu tiên đọc (thứ tự)
- `01_MASTER_PRD_MVP.md`: quyết định nghiệp vụ, chức năng làm và không làm.
- `02_UI_UX_BLUEPRINT.md`: trang, bố cục, token, trải nghiệm, tương tác.
- `03_DOMAIN_DATA_AND_RULES.md`: trường dữ liệu, tính hạn, phân quyền, thống kê.
- `04_GITHUB_REUSE_AUDIT.md`: những gì đã kiểm chứng trong repository nguồn; hạn chế sao chép code demo.
- `05_ACCEPTANCE_TESTS.md`: tiêu chí nghiệm thu khách quan.
- `seed/*.csv`: danh mục chính xác do chủ sản phẩm cung cấp.
- `prototype/index.html`: **mẫu giao diện có dữ liệu giả định**, chỉ để chốt UX, không dùng làm hệ thống thật.

## Nguyên tắc quyết định
- Bắt đầu bằng **01 module Theo dõi nhiệm vụ**, không sao chép các module dự án/giải ngân/ngân sách của Văn Phòng Số.
- Không tạo tài khoản cho 11 đơn vị. Chỉ cán bộ Văn phòng quản trị dữ liệu và lãnh đạo xem số liệu.
- Mỗi nhiệm vụ có **01 nguồn chính** trong 3 nguồn đã chốt; **01 đơn vị chủ trì**, 0..N đơn vị phối hợp.
- Đếm cảnh báo từ thời hạn và ngày hiện tại, không cho người dùng tự sửa cờ `Quá hạn`.
- Dữ liệu thật phải có backend, database, phân quyền phía server, audit log. Không đưa dữ liệu nhiệm vụ chính thức vào site demo công khai.

## Kiến trúc đề xuất
- Frontend: React 18 + TypeScript + Vite + Ant Design + Recharts, kế thừa style/component được chọn của VanPhongSo.
- Backend: ASP.NET Core Web API + EF Core, SQL Server/SQL Server Express; quản lý xác thực và phân quyền server-side.
- Giai đoạn phê duyệt UX: mock API với dữ liệu **được đánh dấu DEMO**, không coi đó là phần mềm đã hoàn thành.
- Không thay đổi repo `VanPhongSo` nếu chưa có yêu cầu riêng. Tạo repo mới, có lịch sử commit rõ.

## Thứ tự nguồn ưu tiên nếu có mâu thuẫn
Tài liệu v1.2 này > bộ tài liệu v1.1 > ảnh chụp hệ thống khác > các giả định do Agent tự nêu. Không tự thêm tính năng vượt MVP.
