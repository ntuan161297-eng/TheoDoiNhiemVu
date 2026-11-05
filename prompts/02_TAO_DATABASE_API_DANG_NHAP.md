Chỉ làm sau khi UI được tôi duyệt. Đọc `docs/product/00_DOC_TRUOC.md`, `03_DOMAIN_DATA_AND_RULES.md`, `01_PRD_NGHIEP_VU_V13.md` và kiểm thử liên quan.

Xây backend ASP.NET Core Web API + EF Core + SQL Server hoặc SQL Server Express, tích hợp React bằng typed API client. KIỂM TRA .NET SDK và SQL Server trước; nếu chưa có, ghi các bước cần cài và dừng xin phép, không âm thầm đổi công nghệ.

Ưu tiên ở chặng này: đăng nhập thật, vai trò ADMIN / OFFICE_EDITOR / OFFICE_CONFIRMER / LEADER_VIEWER; seed danh mục 11 đơn vị, 3 lãnh đạo, 3 nguồn; schema DB, migrations; CRUD nhiệm vụ, quản lý văn bản nguồn, cập nhật tiến độ, xác nhận hoàn thành, lưu audit; API danh sách/bộ lọc, dashboard và tổng hợp theo đơn vị. Không đưa mật khẩu seed vào repo.

BẮT BUỘC: mọi API phải phân quyền server-side; dữ liệu tồn tại sau restart; mọi số KPI tính từ DB; `original_due_date`, `current_due_date`, `completed_date`, `confirmed_at`, lưu timezone Asia/Ho_Chi_Minh; tách status thực hiện/thời hạn/gia hạn; kiểm tra nhập liệu an toàn. Không triển khai deploy public ở chặng này.

Kiểm thử CRUD, auth, phân quyền, lọc, thống kê, persistence; chụp minh chứng và đưa lệnh chạy frontend/backend để tôi thử. Dừng chờ duyệt trước các nghiệp vụ import/đôn đốc/gia hạn.
