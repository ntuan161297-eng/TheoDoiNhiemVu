> BẢN LƯU TRỮ trước khi đồng bộ master Cloudflare ngày 06/11/2026. Không dùng làm chỉ dẫn hiện hành.

Đọc `docs/product/05_ACCEPTANCE_TESTS.md` và `docs/product/03_TEST_NGHIEM_THU_V13.md`, thực hiện kiểm thử phần mềm thực tế trên môi trường local.

Rà soát: chức năng tạo/sửa/import có preview/xác nhận; 11 đơn vị, 3 nguồn, 3 lãnh đạo; KPI theo DB không hardcode; cảnh báo 3–5, 0–2, quá hạn; ghi nhận đôn đốc và đếm đúng; gia hạn pending/rejected giữ hạn, approved đổi hạn; hoàn thành đúng/chậm; xuất Excel tiếng Việt; phân quyền backend; audit logs; thử restart dữ liệu không mất; test responsive 1366x768 và mobile.

Chạy build/lint/unit/integration test phù hợp; liệt kê lỗi còn lại theo mức độ; tạo báo cáo `QA_REPORT.md` và hướng dẫn cài/chạy/sao lưu/khôi phục. Không tuyên bố đã xong nếu còn lỗi blocker hoặc thiếu DB thật/login thật.
