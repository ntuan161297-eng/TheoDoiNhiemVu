# DỮ LIỆU, NGHIỆP VỤ, THỐNG KÊ VÀ PHÂN QUYỀN — CHUẨN MVP

## 1. Các entity tối thiểu
| Bảng/Entity | Các thuộc tính quan trọng | Ghi chú |
|---|---|---|
| `organizations` | id, code, name, kind, is_active | Seed 11 đơn vị, giữ ID ổn định khi đổi tên |
| `leaders` | id, name, title, is_active | Seed 3 lãnh đạo; không đồng nhất với tài khoản |
| `sources` | id, code, name | Seed đúng 3 nguồn |
| `source_documents` | id, document_type, reference_no?, issued_date?, issuer?, summary, file_id? | 1 căn cứ có thể sinh N nhiệm vụ; số ký hiệu có thể trống với cuộc họp chưa ban hành thông báo |
| `tasks` | id(UUID), code, title, body, source_id, source_document_id, primary_org_id, leader_id?, priority, assigned_date, original_due_date, current_due_date, execution_status, completed_date?, confirmed_at?, confirmed_by?, completion_summary?, office_owner_id?, created_at, updated_at, row_version | **Một nhiệm vụ = một dòng đếm thống kê** |
| `task_coordinators` | task_id, organization_id | 0..N đơn vị phối hợp; unique(task_id, organization_id) |
| `task_events` | id, task_id, event_type, detail_json, created_at, created_by | Không sửa lịch sử; tiến độ, đôn đốc, thay hạn, hoàn thành |
| `attachments` | id, task_id?, document_id?, name, mime_type, size, storage_key, uploaded_by, created_at | Kiểm soát file, không public trực tiếp |
| `users` | id, username, pwd_hash, role, is_active, created_at | Roles: ADMIN, OFFICE_EDITOR, OFFICE_CONFIRMER, LEADER_VIEWER |

**Thiết kế API:** server cấp `code` (ví dụ `NV-2026-00001`), kiểm tra uniqueness; dùng GUID/UUID làm khóa chính. Các cột tên không dùng làm khóa; task filter by IDs. Có index `(primary_org_id, assigned_date)`, `(current_due_date, execution_status)`, `(source_id, assigned_date)` và full-text/search phù hợp.

**Lưu ý mô hình tối giản:** bước 1 chỉ 1 hồ sơ căn cứ chính trên nhiệm vụ (`source_document_id`). Sau có thể thêm bảng `task_documents` nếu một nhiệm vụ cần nhiều văn bản căn cứ; không trộn nhiều nhiệm vụ trong một bản ghi. Mọi chứng từ liên quan khác có thể gắn như attachment.

## 2. Trạng thái thực hiện do Văn phòng cập nhật
- `NOT_STARTED` — Chưa thực hiện (mặc định khi tạo).
- `IN_PROGRESS` — Đang thực hiện.
- `COMPLETED` — Đã hoàn thành, chỉ khi Văn phòng xác nhận kết quả; lưu `completed_date`, `confirmed_at`, `confirmed_by`.

Bản MVP không xây `PENDING_APPROVAL` vì đơn vị không sử dụng phần mềm và Văn phòng vừa tổng hợp vừa xác nhận. `PAUSED`, `CANCELLED` và quy trình chờ duyệt là **mở rộng**, không tự tạo nếu chưa có yêu cầu. Nếu phát sinh nghiệp vụ hủy trước khi mở rộng, admin có thể đánh dấu `archived` có lý do trong nhật ký và loại khỏi KPI mặc định.

## 3. Trạng thái hạn — dẫn xuất, không sửa tay
Quy ước: `today` theo `Asia/Ho_Chi_Minh` (`date`), `due` là `current_due_date` (không dùng `Date.now` UTC cắt giờ). `daysLeft = due - today` theo **ngày lịch**.

| Điều kiện (nhiệm vụ CHƯA hoàn thành) | Kết quả | Màu UI |
|---|---|---|
| `daysLeft >= 6` | `ON_TRACK` / Còn hạn | Xanh dương/trung tính |
| `daysLeft = 3..5` | `AT_RISK` / Nguy cơ chậm | Vàng |
| `daysLeft = 0..2` | `URGENT` / Sắp đến hạn | Cam |
| `daysLeft < 0` | `OVERDUE` / Quá hạn | Đỏ |

**Ngày D vẫn là trong hạn đến 23:59:59 của D theo giờ Việt Nam.** D+1 bắt đầu quá hạn. Báo cáo không bắt buộc chạy cron để đổi nhãn: API tính theo ngày tham chiếu hiện tại hoặc SQL tương đương; khi ngày mới đến, mở lại trang số liệu phải cập nhật.

Với task `COMPLETED`, không còn `OVERDUE` hiện hành. Đánh giá kết quả:
- `COMPLETED_ON_TIME` khi `completed_date <= due_date_at_completion`.
- `COMPLETED_LATE` khi `completed_date > due_date_at_completion`.
- `completed_date` là ngày thực tế có chứng cứ được Văn phòng chấp nhận; `confirmed_at` là ngày giờ cán bộ thao tác. Hai ngày có thể khác nhau.
- Mỗi lần xác nhận phải lưu snapshot `due_date_at_completion` để sửa hạn về sau không thay đổi phân loại hoàn thành trước đó.

**Sửa hạn:** lưu `original_due_date` không sửa; nhật ký `OLD_DUE` → `NEW_DUE`, lý do, người sửa, giờ sửa và căn cứ (nếu có). Chỉ người có quyền mới thực hiện. Không dùng việc đổi hạn để âm thầm xóa việc từng quá hạn; có báo cáo lịch sử gia hạn khi cần.

## 4. Báo cáo không đếm trùng
Khi có bộ lọc F, tập nhiệm vụ `T = DISTINCT tasks` theo `primary_org_id` (không nhân các quan hệ 1-n). Định nghĩa KPI:
- `total = |T|` (tập hiện hành, không tính archived/cancelled).
- `completed = count(status=COMPLETED)`.
- `pending = count(status IN {NOT_STARTED, IN_PROGRESS})`.
- `overdue = count(pending AND daysLeft<0)`.
- `risk = count(pending AND daysLeft BETWEEN 3 AND 5)`.
- `urgent = count(pending AND daysLeft BETWEEN 0 AND 2)`.
- `lateCompleted = count(COMPLETED AND completedDate > dueDateAtCompletion)`.

**Đồng nhất:** `total = completed + pending`. `overdue`, `risk`, `urgent` là **các tập con không giao nhau của pending**, không cộng thêm vào tổng. `lateCompleted` là tập con của completed. Có thể bổ sung `ON_TRACK` để phân hoạch toàn bộ pending: `pending = onTrack + risk + urgent + overdue` (đối với nhiệm vụ có hạn).

**Thống kê theo đơn vị:** group by `tasks.primary_org_id`; seed danh sách 11 đơn vị LEFT JOIN để đơn vị không có nhiệm vụ vẫn hiện số 0. Liên kết `task_coordinators` chỉ để lọc/chú thích, không làm tăng tổng của đơn vị phối hợp. Dashboard và báo cáo Excel bắt buộc dùng cùng một query/service tính số để khớp.

**Lọc theo kỳ:** mặc định năm dựa **ngày giao**. Hãy ghi chú nếu người dùng lọc theo ngày hoàn thành hoặc hạn hoàn thành. Mọi KPI nhận cùng một tập `filters`. Điều kiện filter các trường khác nhau = AND; chọn nhiều giá trị cùng trường = OR. Khi drill-down, giữ nguyên filter toàn cục và cộng filter KPI.

## 5. Xử lý các tình huống đặc biệt
- Một văn bản giao 5 nhiệm vụ → 1 `source_document` và 5 `tasks`.
- 1 nhiệm vụ có 2 đơn vị phối hợp → 1 task, không nhân 2, tổng chủ trì chỉ tính 1.
- Đơn vị chủ trì ngừng hoạt động/đổi tên → dữ liệu lịch sử vẫn giữ `org_id` cũ; không cho xóa nếu đã tham chiếu.
- Ngày giao > ngày hạn → không cho lưu (trừ import lịch sử có xác thực và lý do).
- Ngày hoàn thành sau ngày hiện tại → không cho xác nhận.
- Cập nhật đơn vị chủ trì/nguồn/lãnh đạo → ghi audit old/new.
- Nhập số/ký hiệu có dấu gạch, dấu tiếng Việt và số 0 đầu → lưu string.
- Nhiệm vụ chưa có báo cáo nhưng hạn đã qua → `OVERDUE`, không phụ thuộc status manual.
- Có hai cán bộ cập nhật đồng thời → optimistic concurrency bằng row_version, cảnh báo dữ liệu đã thay đổi.
- File đính kèm phải được phân quyền tải, validate MIME + phần mở rộng + kích thước, log ai tải nếu cần; tuyệt đối không lấy đường dẫn local người dùng làm URL công khai.

## 6. Mô hình quyền backend (không chỉ ẩn nút UI)
| Hành động | Admin | Office Editor | Office Confirmer | Leader Viewer |
|---|:---:|:---:|:---:|:---:|
| Xem, lọc, xuất báo cáo | ✓ | ✓ | ✓ | ✓ |
| Tạo/sửa/cập nhật tiến độ | ✓ | ✓ | ✓ | – |
| Đôn đốc, ghi nhận liên hệ | ✓ | ✓ | ✓ | – |
| Xác nhận hoàn thành | ✓ | – | ✓ | – |
| Sửa hạn có lý do | ✓ | – | ✓ | – |
| Quản trị danh mục, tài khoản | ✓ | – | – | – |

MVP có thể cấu hình một người dùng thuộc Văn phòng có cả Office Editor + Office Confirmer, nhưng phải lưu `confirmed_by`. Không mặc định cấp quyền ghi cho lãnh đạo hoặc đơn vị chuyên môn.

**Yêu cầu an toàn tối thiểu:** mật khẩu hash chuẩn (ASP.NET Identity), HTTPS, session/token bảo vệ, CSRF nếu dùng cookie, validation server, chống SQL injection qua ORM, file scan nếu môi trường có, log đăng nhập/thay đổi, backup tự động và kiểm thử khôi phục. Không dùng frontend localStorage boolean như xác thực thật.

## 7. API gợi ý cho Agent (không bắt buộc phải đúng URL)
`GET /api/tasks?year=&sourceId=&primaryOrgId=&leaderId=&executionStatus=&deadlineBucket=&search=&page=&pageSize=`; `POST /api/tasks`; `GET/PATCH /api/tasks/{id}`; `POST /api/tasks/{id}/progress`; `POST /api/tasks/{id}/expedites`; `POST /api/tasks/{id}/complete`; `POST /api/tasks/{id}/change-deadline`; `GET /api/dashboard/summary`; `GET /api/reports/by-organization`; `GET /api/reports/export`; `GET /api/lookups`.

Tất cả response có mã lỗi và thông điệp tiếng Việt hữu ích. `dashboard/summary` và `reports/by-organization` dùng chung service thống kê, có `asOf` theo GMT+7.
