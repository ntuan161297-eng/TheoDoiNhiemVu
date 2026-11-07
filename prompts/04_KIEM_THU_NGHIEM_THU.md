# CHẶNG E — QA, BACKUP/RESTORE VÀ TRIỂN KHAI CÓ DUYỆT

Chỉ thực hiện phạm vi E được chủ sản phẩm giao sau các chặng trước. Đọc master Cloudflare, kế hoạch, bảng truy vết và test V1.3/V1.2 phù hợp. Không dùng báo cáo 28 unit/9 browser của A để nghiệm thu D1/Auth/multi-tenant chưa làm.

Kiểm tra tự động và bằng trình duyệt: CRUD/tiến độ/hoàn thành, hạn 6/5/3/2/0/-1 và nửa đêm Việt Nam, snapshot, đôn đốc nhiều task/sửa/hủy, gia hạn pending/rejected/approved/lần 2, import preview/lỗi/trùng/confirm/rollback, export Excel, lọc/KPI/report đúng DISTINCT ID và chủ trì. Kiểm tra responsive 1366×768, tablet/mobile, keyboard và error/loading/retry.

Security tests trên Worker API thật: JWT invalid/expired/provider sai, membership khóa/revoke, role thiếu, tự nâng quyền, đổi tenant và task/document/unit/file ID, file/report/export/import xuyên tenant, cache khi chuyển context, Super Admin không mặc định đọc data nội bộ, audit chỉ đúng phạm vi và không xóa trái phép. Không chỉ test UI hoặc SQL owner.

Backup/restore D1 **và nội dung R2** cùng metadata/audit, trên môi trường test được cho phép; backup source ZIP không thay cho database/file backup. Kiểm tra file nhị phân tải lại sau restore, không chỉ row metadata. Không thử reset/drop database remote có dữ liệu thật.

Chạy build/typecheck/unit/integration/browser theo thay đổi, báo blocker và test chưa chạy. Tạo QA_REPORT/hướng dẫn vận hành, thể hiện trace từng yêu cầu master. Chỉ tạo Worker Preview khi được phép triển khai Preview, dùng dữ liệu giả và tài nguyên staging độc lập; không đổi Vercel Production. Production là phê duyệt riêng sau nghiệm thu, không phải hệ quả tự động của một lệnh push/Save and Deploy.

Trình bày kết quả thật và giới hạn; không tuyên bố hoàn tất hệ thống khi còn DB/Auth/quyền/file/backup chưa kiểm chứng. Dừng tại ranh giới được duyệt.
