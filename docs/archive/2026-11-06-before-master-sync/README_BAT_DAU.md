> BẢN LƯU TRỮ trước khi đồng bộ master Cloudflare ngày 06/11/2026. Không dùng làm chỉ dẫn hiện hành.

# BẮT ĐẦU TẠO PHẦN MỀM TRONG ANTIGRAVITY

## 1) Chuẩn bị
Giải nén ZIP này vào thư mục **MỚI** `C:\Projects\ubnd-huong-do-tasks`. Không giải nén chồng vào repository `VanPhongSo` cũ.

## 2) Mở Antigravity
Mở Antigravity, chọn Open Folder (hoặc New Project → Add Folder → Create, tùy phiên bản). Chọn `C:\Projects\ubnd-huong-do-tasks`. Chỉ tin cậy workspace nếu đây là thư mục bạn chủ động tạo.

## 3) Giai đoạn 1 — Phân tích, chưa code
Mở file `prompts/00_PHAN_TICH_TRUOC_KHI_CODE.md`, copy **toàn bộ nội dung**, dán vào ô Agent. Chọn Planning Mode nếu có; không cấp quyền tự động chạy mọi lệnh. Đọc bản kế hoạch và yêu cầu sửa đến khi đúng nghiệp vụ.

## 4) Giai đoạn 2 — UI demo
Sau khi đồng ý kế hoạch, dán prompt `prompts/01_DUNG_GIAO_DIEN_MAU.md`. Cho Agent chạy ứng dụng local, kiểm tra Dashboard, lọc, drawer, form, import wizard, màn đôn đốc và gia hạn. **Chỉ là dữ liệu giả.**

## 5) Giai đoạn 3 — DB thật và API
Dán `prompts/02_TAO_DATABASE_API_DANG_NHAP.md`. Kiểm tra Node, Git, .NET SDK, SQL Server/Express; để agent báo thiếu trước khi cài. Sau chặng này phải tạo/sửa nhiệm vụ, đăng nhập và xem báo cáo từ DB thật.

## 6) Giai đoạn 4 — Import Excel, đôn đốc, gia hạn
Dán `prompts/03_IMPORT_DON_DOC_GIA_HAN.md`. Dùng mẫu Excel có trong `docs/product`. Test nhập trùng, lỗi dòng/cột, 1 văn bản đôn đốc nhiều nhiệm vụ và văn bản gia hạn có kết quả.

## 7) Giai đoạn 5 — Nghiệm thu
Dán `prompts/04_KIEM_THU_NGHIEM_THU.md`. Kiểm thử và chỉ đưa dữ liệu thật vào khi đã thiết lập quyền, sao lưu, bảo mật file và tài khoản.

## CẦN NHỚ
- Nguồn ưu tiên: V1.3 > V1.2 nếu khác nhau.
- Thư mục `docs/product/reference` chỉ là thiết kế mẫu có dữ liệu demo.
- Không tự đẩy mã nguồn, database, thông tin đăng nhập hoặc tài liệu hành chính lên GitHub public.
- Mỗi chặng chỉ chuyển tiếp khi đã kiểm tra và chấp thuận chặng trước.
