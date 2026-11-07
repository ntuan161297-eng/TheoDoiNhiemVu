# CHẶNG D — NGHIỆP VỤ THẬT, R2, IMPORT/EXPORT

Chỉ triển khai sau khi các nền tảng B/C cần thiết được nghiệm thu và chủ sản phẩm giao D. Đọc master Cloudflare, kế hoạch, toàn bộ PRD/UX/test V1.3, CSV và Excel. Tích hợp vào component sẵn có qua `src/services/api.ts`; không viết frontend mới hoặc coi mock là dữ liệu thật.

Thực hiện từng nhóm và test tương ứng:
1. CRUD task/căn cứ/phối hợp thật qua Worker API/D1; một nguồn/chủ trì/lãnh đạo, audit, version/idempotency, tenant guard cho tất cả liên kết. Chưa có API hợp lệ thì không fallback sang DEMO như thành công.
2. Tiến độ và hoàn thành: ngày thực tế/kết quả/quyền Confirmer, timestamp actor server, snapshot hạn; 100% không tự hoàn thành, không sửa hạn gốc, không hồi tố kết quả âm thầm.
3. Dashboard/báo cáo từ D1, DISTINCT task ID trong tenant, thống kê theo chủ trì, đủ danh mục Hương Đô kể cả 0; phối hợp không cộng trùng. Bộ lọc/KPI/list/drill-down/export cùng tập dữ liệu/asOf, không hardcode.
4. R2 private: upload server validation, metadata D1, tenant/object ownership, API tải có quyền, không public URL cho tài liệu nội bộ; pending/ready/retry/dọn orphan, không hứa D1/R2 chung transaction.
5. Đôn đốc: một văn bản nhiều task cùng tenant; số/ngày/cơ quan/nội dung/file; sửa không tăng count, hủy/đính chính có audit, không đổi status/hạn task.
6. Gia hạn: request + file/lý do/hạn đề nghị; một pending/task; pending/rejected giữ hạn gần nhất; approved có căn cứ và Confirmer mới đổi current_due_date, giữ original_due_date/snapshot/lịch sử. Lần 2 giữ hạn duyệt lần 1 đến khi có quyết định hợp lệ. Luồng hủy/đính chính phải được chốt riêng, không xóa dấu vết.
7. Excel thật ba bước: đọc NHAP_NHIEM_VU header dòng 5/data từ 6, 19 cột; không tự nhập VI_DU/DANH_MUC. Validate/normalize/preview lỗi dòng-cột/nghi trùng; lựa chọn rõ trước ghi; revalidate tenant/role/version ở backend khi confirm. Không nhập một phần ngoài ý muốn, không ghi đè hạn gốc/lịch sử. Dòng completed cần quyền xác nhận. Export workbook tiếng Việt phản ánh đúng bộ lọc, tenant và số liệu.

Cảnh báo ngày lịch Asia/Ho_Chi_Minh: >=6 còn hạn, 3–5 nguy cơ, 0–2 khẩn, <0 quá hạn; completed bỏ cảnh báo hiện hành và phân loại theo snapshot. Không gộp status thực hiện/hạn/gia hạn. Không tự gửi văn bản ra ngoài.

Mọi write liên bảng dùng D1 transaction/batch có guard và kiểm thử rollback/version/race/retry; không mang Postgres RPC/RLS sang. API đọc/ghi/report/export/import/download đều phải chặn xuyên tenant. Test TC01–29 V1.3 phù hợp nhóm, mẫu Excel lỗi, 0/-1 ngày, 2 lần gia hạn, một VB nhiều task, file không quyền và trường hợp rollback. Báo phần đã đạt/thật/mô phỏng/còn thiếu; dừng trước E, không chạy remote/deploy ngoài phê duyệt.
