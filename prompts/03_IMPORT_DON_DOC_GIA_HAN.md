Chỉ bắt đầu sau khi API và DB ở chặng trước hoạt động thật. Đọc `docs/product/01_PRD_NGHIEP_VU_V13.md`, `02_UI_UX_V13.md`, `03_TEST_NGHIEM_THU_V13.md` và workbook `Mau_Import_NhiemVu_UBND_HuongDo_v1_3.xlsx`.

THỰC HIỆN THEO THỨ TỰ VÀ KIỂM THỬ TỪNG NHÓM:
1. Import Excel 3 bước: chọn file .xlsx → đọc đúng sheet NHAP_NHIEM_VU (header dòng 5, data từ dòng 6), đối chiếu danh mục, báo lỗi dòng/cột và nghi trùng, preview → người dùng xác nhận mới ghi DB, audit và hiển thị kết quả. Không import VI_DU hay DANH_MUC. Không ghi dữ liệu lặp âm thầm.
2. Ghi nhận văn bản đôn đốc: số/ngày/nơi ban hành/nội dung/tệp; một văn bản có thể gắn nhiều nhiệm vụ; số lần đôn đốc của nhiệm vụ tăng đúng một lần cho mỗi liên kết hợp lệ; sửa bản ghi không tăng; ghi audit. Đôn đốc không làm đổi trạng thái/hạn.
3. Xin gia hạn: văn bản đề nghị, hạn xin gia hạn, lý do và tệp; kết quả chấp thuận/từ chối có văn bản. Chỉ có chấp thuận hợp lệ mới đổi current_due_date; giữ hạn gốc và nhật ký. Pending hay rejected không đổi hạn. Cho phép xin nhiều lần tuần tự nhưng không có hai yêu cầu pending đồng thời.
4. Hoàn thành: ngày hoàn thành thực tế + kết quả + người xác nhận; đánh giá đúng/chậm theo hạn áp dụng tại thời điểm hoàn thành. Đảm bảo KPI tính lại tức thời từ DB sau các hành động.

Xác thực upload, quyền API, chống trùng, 10 mẫu Excel lỗi, tình huống ngày 0/qua hạn và 2 lần xin gia hạn. Trình bày những test đã chạy và chưa đạt, xin duyệt trước giai đoạn QA.
