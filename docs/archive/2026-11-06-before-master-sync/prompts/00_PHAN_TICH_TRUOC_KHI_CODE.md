> BẢN LƯU TRỮ trước khi đồng bộ master Cloudflare ngày 06/11/2026. Không dùng làm chỉ dẫn hiện hành.

/plan Xây dựng kế hoạch cho dự án Web "Theo dõi, Cảnh báo và Đôn đốc nhiệm vụ UBND xã Hương Đô".

BẠN LÀ: Business Analyst, Solution Architect và UI/UX Lead của ứng dụng nghiệp vụ hành chính Việt Nam.

QUAN TRỌNG: Lượt này CHỈ PHÂN TÍCH, KHÔNG viết code, KHÔNG cài dependency, KHÔNG thực hiện lệnh thay đổi file, KHÔNG commit/push hoặc deploy.

ĐỌC TOÀN BỘ tài liệu trong docs/product: ưu tiên `00_DOC_TRUOC.md`, các tài liệu PRD/UX, business rules, test V1.2 và V1.3, `seed/*.csv` và cấu trúc mẫu Excel. Nếu mâu thuẫn: V1.3 ưu tiên hơn V1.2.

MỤC TIÊU: Lãnh đạo Văn phòng HĐND-UBND xã nắm tiến độ các đơn vị; cán bộ Văn phòng nhập/sửa hoặc import Excel; phần mềm cảnh báo hạn; ghi nhận văn bản đôn đốc và số lần đôn đốc; lưu văn bản xin gia hạn, kết quả xét và chỉ đổi hạn sau khi được chấp thuận; xác nhận hoàn thành; báo cáo theo 11 đơn vị. Phòng chuyên môn không đăng nhập ở MVP.

UI tham khảo: https://github.com/ntuan161297-eng/VanPhongSo — chỉ nghiên cứu layout và các component React/Ant Design. Tuyệt đối KHÔNG sửa repo này hoặc mang dữ liệu mock, KPI hardcode, auth demo của tỉnh Hưng Yên sang.

Công nghệ ưu tiên: frontend React + TypeScript + Vite + Ant Design + Recharts; backend ASP.NET Core Web API + EF Core + SQL Server/Express. Kiểm tra máy có Node, Git, .NET SDK và SQL Server nhưng không tự cài khi chưa được phê duyệt.

TRẢ VỀ bằng tiếng Việt:
1. Phạm vi MVP: làm gì và không làm gì (tối đa 5 trang + login).
2. Sơ đồ thao tác và ma trận vai trò: Văn phòng nhập và xác nhận; lãnh đạo xem.
3. Sitemap, UX desktop/tablet/mobile, form thêm nhiệm vụ, import Excel 3 bước, đôn đốc, gia hạn, timeline.
4. ERD các bảng chính, bản ghi văn bản căn cứ/đôn đốc/gia hạn và quan hệ.
5. Công thức hạn, phân biệt trạng thái thực hiện/hạn/gia hạn; cách đếm KPI không trùng.
6. Các component GitHub có thể tham khảo và những phần phải viết mới.
7. Chia thành 4 chặng có tiêu chí nghiệm thu: UI mock → DB/API/Auth → Import/Đôn đốc/Gia hạn → QA.
8. Liệt kê tối đa 5 quyết định còn thực sự chưa rõ. Không hỏi lại điều đã ghi trong tài liệu.

Hãy tạo file `docs/analysis/IMPLEMENTATION_PLAN.md` CHỈ NẾU tôi cho phép ghi tài liệu; nếu chưa, trình bày trong chat để duyệt. Kết thúc: 'CHỜ CHỦ SẢN PHẨM DUYỆT KẾ HOẠCH'.
