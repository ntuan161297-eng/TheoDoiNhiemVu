# TRIỂN KHAI CODE CHẶNG A — CLOUDFLARE FULL-STACK

## 1. Bối cảnh

Tôi đã hoàn thành cập nhật tài liệu kiến trúc Cloudflare của dự án Theo dõi và Đôn đốc nhiệm vụ.

Các tài liệu hiện có:
- docs/cloudflare/MASTER_PROMPT.md
- docs/cloudflare/REQUIREMENTS_TRACEABILITY.md
- docs/IMPLEMENTATION_PLAN.md
- docs/product/
- docs/analysis/

Dự án local: `D:\ubnd-huong-do-tasks`

GitHub: https://github.com/ntuan161297-eng/TheoDoiNhiemVu

Cloudflare Production:
https://theodoinhiemvu.ntuan161297.workers.dev

**Tôi yêu cầu bắt đầu LẬP TRÌNH THỰC TẾ Chặng A, không chỉ tiếp tục viết tài liệu.**

## 2. Xác nhận kiến trúc

Cloudflare Dashboard đang hiển thị Workers & Pages → theodoinhiemvu → Production, có Version ID, Traffic %, Median CPU time và Edit code.

Triển khai theo hướng:
- React + TypeScript + Vite.
- Cloudflare Workers Static Assets phục vụ frontend.
- Cloudflare Worker xử lý API `/api/*`.
- Cloudflare D1 và R2 cho giai đoạn tiếp theo.

Không tạo thêm Cloudflare Pages Project.

Các tài liệu đang ghi Pages/Functions cần được đồng bộ thành kiến trúc Workers Static Assets + Worker API, trừ khi phát hiện bằng chứng kỹ thuật rằng Production đang sử dụng loại hình khác. Nếu có xung đột, báo cáo cụ thể.

## 3. Nhiệm vụ 1 — Kiểm tra và bảo vệ dự án

- Đọc mã nguồn local mới nhất cùng các tài liệu hiện hành.
- Kiểm tra Git status và các thay đổi chưa commit.
- Không ghi đè các thay đổi hiện có.
- Tạo checkpoint hoặc backup an toàn trước khi sửa.
- Kiểm tra package.json, vite.config.ts, tsconfig.json và cấu hình Cloudflare.
- Xác định chính xác cách project hiện tại được build và deploy.
- Không tạo ứng dụng React mới.

## 4. Nhiệm vụ 2 — Tích hợp Worker API

Bổ sung Worker entry point bằng TypeScript, theo cấu trúc phù hợp với dự án.

Tạo API:

GET /api/health

Kết quả phải là HTTP 200 với JSON:

{
  "status": "ok",
  "service": "theo-doi-nhiem-vu-api"
}

Yêu cầu:
- Content-Type: application/json; charset=utf-8.
- Cache-Control: no-store.
- Các API không tồn tại phải trả HTTP 404 JSON, không trả index.html.
- Method không được hỗ trợ phải trả lỗi HTTP phù hợp.
- Không để API health tiết lộ cấu hình bí mật.
- Chưa cần kết nối database.

## 5. Nhiệm vụ 3 — Cấu hình Cloudflare

Kiểm tra phiên bản Wrangler và cấu hình hiện tại.

Nếu sử dụng Wrangler với Workers Static Assets thông thường, thiết lập tương đương:

{
  "name": "theodoinhiemvu",
  "main": "./worker/index.ts",
  "compatibility_date": "2026-11-06",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }
}

Đây là cấu hình tham khảo. Hãy điều chỉnh đường dẫn và thuộc tính theo công cụ thực tế; không ghi đè một cấu hình đang hoạt động chỉ để khớp ví dụ.

Nếu sử dụng Cloudflare Vite plugin, áp dụng cấu hình đúng theo plugin thay vì sao chép nguyên cấu hình Wrangler truyền thống.

Yêu cầu:
- API `/api/*` được Worker xử lý trước.
- React Router vẫn hoạt động khi mở URL trực tiếp.
- Giao diện và static assets vẫn tải đúng.
- Không làm ảnh hưởng đến Vercel.
- Không hardcode secrets.

## 6. Nhiệm vụ 4 — Giữ nguyên giao diện và nghiệp vụ

Giữ các trang:
- Đăng nhập.
- Dashboard/Tổng quan.
- Quản lý nhiệm vụ.
- Cần đôn đốc.
- Báo cáo đơn vị.
- Danh mục/cấu hình.

Giữ toàn bộ:
- Ant Design và Design System.
- Các biểu mẫu, Drawer, bảng biểu, bộ lọc.
- Tính toán thời hạn, KPI.
- Tiến độ, đôn đốc, gia hạn.
- Các bài test nghiệp vụ hiện có.

Ở Chặng A được phép giữ dữ liệu DEMO và đăng nhập giả lập để kiểm tra UI. Phải thể hiện rõ đây là DEMO, không được coi là xác thực thật.

Chưa thay DemoProvider nếu API và Auth thật chưa hoàn chỉnh.

## 7. Nhiệm vụ 5 — Chuẩn bị API Service

Bổ sung lớp gọi API phía frontend, ví dụ:

src/services/api.ts

Yêu cầu:
- Gọi các API bằng đường dẫn tương đối `/api/...`.
- Có xử lý HTTP errors.
- Có kiểu dữ liệu TypeScript rõ ràng.
- Không chứa database credentials hay secret keys.
- Chưa chuyển các trang nghiệp vụ sang dữ liệu thật trong Chặng A.

Mục tiêu là có nền tảng kết nối API cho Chặng B–D.

## 8. Nhiệm vụ 6 — Kiểm thử bắt buộc

Thực hiện:
1. npm run build.
2. npm run test.
3. Khởi động Worker local bằng công cụ phù hợp.
4. Gọi GET /api/health bằng curl hoặc fetch.
5. Kiểm tra HTTP status và Content-Type.
6. Mở /tong-quan trực tiếp.
7. Mở /nhiem-vu trực tiếp.
8. Kiểm tra /api/khong-ton-tai trả 404 JSON.
9. Kiểm tra request với Sec-Fetch-Mode: navigate.
10. Kiểm tra các assets JS/CSS tải bình thường.

Nếu kiểm thử thất bại, sửa lỗi và chạy lại.

Không tuyên bố hoàn thành nếu chưa kiểm tra được API thực tế.

## 9. Giới hạn thao tác

Trong lượt này được phép:
- Sửa mã nguồn local.
- Tạo Worker API.
- Cài dependency cấp dự án nếu cần.
- Sửa cấu hình build.
- Bổ sung test.
- Đồng bộ tài liệu tương ứng với thay đổi code.

Chưa được:
- Push trực tiếp nhánh main.
- Deploy Production.
- Chạy remote migration.
- Tạo dữ liệu thật trong D1.
- Đưa văn bản nội bộ lên Cloudflare.
- Xóa dự án Vercel.
- Xóa hoặc viết lại các chức năng đã làm.

## 10. Báo cáo kết quả

Sau khi thực hiện xong, trả về:

1. Các file đã tạo/sửa.
2. Nguyên nhân `/api/health` trước đây trả HTML.
3. Kiến trúc Worker cuối cùng.
4. Kết quả build và test.
5. Kết quả gọi API local kèm status và Content-Type.
6. Những chức năng đã hoạt động.
7. Những chức năng chưa triển khai.
8. Hướng dẫn triển khai lên Cloudflare Preview qua nhánh riêng.
9. Những thao tác thủ công tôi cần thực hiện.

**Hãy thực hiện thay đổi CODE ngay trong lượt này. Không dừng ở việc viết kế hoạch hoặc xin xác nhận lại Chặng A.**

Sau khi hoàn tất và kiểm thử local, dừng để tôi nghiệm thu trước khi triển khai Cloudflare Preview.

Mục tiêu: Hoàn thành Chặng A với React frontend và Cloudflare Worker API hoạt động chung, sẵn sàng kết nối D1 Multi-Tenant ở Chặng B.