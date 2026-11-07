# CHẶNG C — QUẢN TRỊ NỀN TẢNG VÀ TENANT

Chỉ triển khai khi B đã nghiệm thu và được giao C. Theo master Cloudflare/kế hoạch; giữ nguyên năm trang nghiệp vụ và Design System, bổ sung vùng quản trị được master yêu cầu.

Super Admin: tạo/quản lý tenant, tạo Tenant Admin, xem tình trạng tenant và cấu hình nền tảng; không mặc định xem task/văn bản/file nội bộ. Tenant Admin: TreeView tenant/cơ cấu, thêm/sửa/ngừng đơn vị, quản trị user/membership/role/assignment trong tenant, tạo account/gửi invite, yêu cầu reset password qua identity provider, khóa/thu hồi quyền tenant, xem audit đúng phạm vi.

Không tự phát triển password/invite/reset token thủ công. Quyền thao tác Admin API của provider phải ở Worker API/server secrets, kiểm tra actor/tenant trước; không đưa service key ra browser. Không gửi email thử hay tạo tài khoản Cloud thật ngoài phạm vi được duyệt.

TreeView không được tạo chu trình hoặc gắn parent/assignment khác tenant. Đổi tenant phải tải lại quyền/cây và xóa cache/selection cũ. Không dùng isAdmin toàn cục làm quyền đọc dữ liệu mọi tenant; sửa đặc quyền phải audit, có biện pháp chống tự nâng quyền và mất tài khoản quản trị hợp lệ cuối cùng theo policy đã duyệt.

Test API trực tiếp lẫn UI, đổi tenant ID, role/assignment khác tenant, user khóa/thu hồi, invite/reset và tính riêng tư audit. Báo file/test/kết quả; không đụng Vercel Production, migration remote hoặc chuyển D khi chưa được cho phép.
