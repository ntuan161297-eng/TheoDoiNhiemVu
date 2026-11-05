# Supabase — Bước 2.2, file migration để duyệt

**Chỉ tạo file và kiểm tra tĩnh. Chưa link project, chạy SQL, tạo Admin, nối frontend hoặc deploy.**

Mục tiêu PostgreSQL 17 trở lên; cần xác nhận version thực tế và chạy kiểm thử trên môi trường thử nghiệm phù hợp sau khi chủ sản phẩm cho phép. Không cài PostgreSQL, Docker, .NET, SQL Server hoặc thay cấu hình Windows ở bước này.

## 1. Bộ file và thứ tự áp dụng

| Version | File migration | Nội dung |
|---|---|---|
| 20261105090000 | `identity_and_lookups.sql` | Role nội bộ NOLOGIN/NOBYPASSRLS, schema private, profiles/roles, danh mục, helpers RLS, provisioning profile không tự cấp role |
| 20261105090100 | `domain_schema.sql` | Task/căn cứ/phối hợp/tiến độ, đôn đốc/gia hạn/file/import/audit/idempotency, FK/unique/check/index, mặc định chỉ đọc qua RLS |
| 20261105090200 | `invariants_and_audit.sql` | Hạn/hoàn thành, ràng buộc liên bảng deferred, hạn gốc/snapshot bất biến, audit append-only, chống mất chứng cứ |
| 20261105090300 | `transaction_functions.sql` | Transaction CRUD/tiến độ/hoàn thành/lưu trữ/role; các hàm GĐ3 private chưa cấp client EXECUTE |
| 20261105090400 | `read_models_and_storage.sql` | View invoker, bộ lọc/KPI/11 đơn vị, bổ sung index FK, bucket private và quyền đọc Storage |
| 20261105090500 | `official_catalog_seed.sql` | Chỉ 11 units, 3 leaders, 3 task_sources từ CSV, UUID ổn định |

Tên đầy đủ có dạng `<version>_<file>` trong `migrations/`. Không có `seed.sql` nhập nhiệm vụ; `[db.seed].enabled=false`. Catalog được version hóa bằng migration cuối, không cần `--include-seed`. Việc seed có tạo audit khởi tạo danh mục, không phải dữ liệu nhiệm vụ giả lập.

16 bảng public và `private.operation_requests` (17 tổng cộng). Giữ mã DV01..DV11, LD01..LD03 và ba source code, đúng tên/chức danh CSV, kể cả chữ hoa DV06. Không tạo `auth.users`, tài khoản cho đơn vị hay role membership trong migration. `auth.users` là bảng có sẵn do Supabase quản lý.

## 2. Bảo mật và các hợp đồng SQL

- Data API chỉ expose `public`; **không thêm `private` vào Exposed schemas**. `config.toml` là cấu hình local, không tự áp dụng cài đặt Auth/API trên Cloud.
- Role nội bộ `huong_do_executor`: NOLOGIN, không superuser/BYPASSRLS; không cấp cho anon/authenticated. Chỉ role quản trị DB `postgres` được membership để quản lý ownership. Role này có policy và grants đúng bảng cần dùng, không quyền sửa/xóa audit.
- Mọi SECURITY DEFINER ở `private`, search_path rỗng, owner nội bộ, EXECUTE thu hẹp. Trigger functions không được client gọi trực tiếp. Public RPC ghi là SECURITY INVOKER, chỉ chuyển tiếp đến entry point private có kiểm tra quyền. Pure helper tính hạn và RPC đọc cũng INVOKER.
- Các bảng exposed có RLS và explicit SELECT policy. Không cấp DML/TRUNCATE/TRIGGER/sequence cho client; không cho dùng REST cập nhật hạn/status/quyền. Bốn application roles đều chạy dưới Postgres `authenticated`, được phân biệt bằng `profiles`/`user_roles` tại DB, không phải trường role do client tự chọn.
- ADMIN gồm quyền nghiệp vụ, OFFICE_CONFIRMER gồm quyền nhập. Không có role/khóa profile/anonymous Auth user thì không được đọc dữ liệu nghiệp vụ. Own profile/role vẫn có thể đọc để UI báo trạng thái tài khoản; không thể tự sửa.
- Chỉ ADMIN quản lý role/profile của **người khác** qua `set_user_access`, không tự đổi role/trạng thái, giữ ít nhất một admin hoạt động. Mọi thay đổi có audit. Migration không bootstrap Admin; provisioning user và bootstrap thuộc bước sau, cần duyệt riêng.
- Default function EXECUTE của role postgres bị thu hồi khỏi PUBLIC để tránh hàm mới tự mở quyền. Project phải riêng cho ứng dụng; cần review quyền hạ tầng/role và schema trước khi apply.

RPC ghi GĐ2 đã có SQL, **chưa chạy và chưa nối React**:

| RPC public | Quyền | Hợp đồng |
|---|---|---|
| `save_source_document(payload,id,expected,key)` | Editor/Confirmer/Admin | Payload đầy đủ; id=null để tạo, sửa cần version |
| `save_task(payload,id,expected,coordinators,key)` | Editor/Confirmer/Admin | Payload đầy đủ theo whitelist, không phải JSON PATCH; giữ original_due_date khi sửa; phối hợp là tập thay thế toàn bộ |
| `add_progress(task,expected,date,content,percent,difficulty,key)` | Editor/Confirmer/Admin | 0..100 không tự hoàn thành; ghi tiến độ + task version + audit nguyên tử |
| `confirm_completion(task,expected,date,summary,key)` | Confirmer/Admin | Ngày thực tế hợp lệ + kết quả, snapshot hạn, actor/server time |
| `archive_task(task,expected,archive,reason,key)` | Admin | Lưu trữ mềm/khôi phục có lý do; không xóa task/hồ sơ |
| `set_user_access(user,roles,active,key)` | Admin | Target người khác, kiểm tra role, khóa quản trị và audit |

Mỗi `key` là UUID idempotency do client tạo cho một lần gửi; retry giữ key và payload, thao tác mới dùng key mới. Cùng key khác nội dung bị từ chối. `save_task` có thể nhận `new_source_document` thay `source_document_id`; căn cứ + task + phối hợp ghi trong cùng transaction. Các mã SQLSTATE quan trọng: `42501` sai quyền, `40001` stale version (đọc lại rồi xử lý xung đột), `23514` sai nghiệp vụ, `23505` trùng, `22023` payload/key không hợp lệ. UI sẽ ánh xạ lỗi ở bước tích hợp.

Read API: `task_read_model`, `filtered_tasks`, `dashboard_kpi`, `report_by_unit`. Cùng `filters`/`as_of`, một dòng/task, count DISTINCT, phối hợp lọc qua EXISTS. Bộ lọc JSON có `search`, `year`, `source_ids`, `unit_ids`, `leader_ids`, `execution_status`, `deadline_state`, `extension_state`, `assigned_from/to`, `priority`, `coordinator_id`, `expedited`, `include_archived`. Mảng trong cùng trường OR, các trường AND; mảng rỗng chọn không có bản ghi; bỏ trường để không lọc. `as_of` chỉ đổi ngày tham chiếu cho phân loại hạn trên **dữ liệu hiện hành**, không phục dựng database lịch sử. Hàm ghi luôn dùng ngày server Việt Nam.

Hạn: >=6 Còn hạn; 3–5 Nguy cơ; 0–2 Khẩn; <0 Quá hạn. Completed không còn cảnh báo hiện hành, so ngày thực tế với snapshot. Hạn gốc không sửa; current_due_date đối chiếu với quyết định approved gần nhất bằng constraint trigger deferred. Các thao tác liên quan khóa task trước, rồi hồ sơ; version và audit trong transaction. Function/RPC là một transaction của lệnh gọi; không cần nhiều request REST liên tiếp để ghi liên bảng.

## 3. Ranh giới Giai đoạn 3 và Storage

Đã chuẩn bị `private.request_extension`, `resolve_extension`, `create_expedite`, `bind_verified_attachment`, bảng import và ràng buộc dữ liệu. **Không có public wrapper hoặc authenticated EXECUTE cho các hàm GĐ3.** Chưa triển khai import parser/commit, sửa/hủy/đính chính gia hạn, quản lý vòng đời đôn đốc hoặc giao diện dữ liệu thật của GĐ3. SQL test nội bộ không có nghĩa đã mở chức năng GĐ3 cho ứng dụng.

Bucket `task-documents` được migration 05 tạo private, PDF/JPEG/PNG, tối đa 10 MiB/file. Migration dừng để review nếu bucket hoặc Storage policy đã có sẵn; không tự xóa hoặc nới quyền tài nguyên cũ. Cần dùng project thử nghiệm riêng.

Chỉ policy đọc Storage ở bước này: metadata READY được đọc bởi user có quyền nghiệp vụ; PENDING chỉ uploader/admin. Không có client policy INSERT/UPDATE/DELETE, chưa có upload/finalize RPC, chưa cấp API thay verified_at/by. Đừng tắt RLS hoặc bật public để thử tải. Bước file sau phải kiểm tra nội dung/MIME/kích thước và object tồn tại; chỉ server tin cậy mới xác minh file. `bind_verified_attachment` yêu cầu verified_at/by và private Storage object trước khi READY. Chưa triển khai quét malware hoặc cấp signed URL.

Storage và PostgreSQL không chung transaction. Sau này cần pending/expiry, retry và dọn object mồ côi qua Storage API. SQL metadata không chứng minh file nhị phân đã upload. File READY không ghi đè, đổi chủ thể hoặc xóa; file đề nghị và phản hồi phân biệt purpose. Không đưa văn bản thật/dữ liệu nội bộ lên Cloud.

## 4. Kiểm tra offline đã chạy ở Bước 2.2

```powershell
npm run check:sql
```

Parser `libpg-query@18.2.2` chạy WebAssembly local, chỉ dev dependency, không được import vào bundle UI. Phân tích DDL, SQL/PLpgSQL bodies, DO blocks và SQL trong các case dự kiến bị từ chối; đối chiếu FK/PK/RLS, exposed DEFINER, grants client, seed với CSV từng trường. Report tái tạo tại `docs/qa/STAGE2_MIGRATION_STATIC.json`, gồm hash SHA-256 của từng file SQL.

Grammar parser là PostgreSQL 18, source nhắm PostgreSQL 17-compatible. **Parse thành công không thay cho compile trên PostgreSQL 17**, không resolve đầy đủ function/type/column theo catalog, không thực thi RLS, không xác minh Auth/Storage thực tế hoặc chứng minh concurrency. Không có lệnh database/network trong script kiểm tra. Không đổi báo cáo tĩnh thành kết quả nghiệm thu chạy DB.

Migration không có BEGIN/COMMIT top-level: Supabase migration runner tự quản lý transaction và lịch sử. Test/verification có BEGIN...ROLLBACK riêng vì chạy độc lập. [Supabase giải thích xung đột transaction nhúng](https://supabase.com/kb/troubleshooting/partial-migrations-and-schema-inconsistencies-from-embedded-transactions-13ae82).

## 5. Kết nối project và chạy migration — CHỈ SAU KHI ĐƯỢC DUYỆT

Các bước dưới đây là hướng dẫn, **chưa được thực hiện**. Không có project ref/URL/password/key được ghi trong repo.

1. Xác nhận project thử nghiệm riêng, version PostgreSQL >=17, chủ project và khả năng backup nếu có dữ liệu. Trong Dashboard tắt sign-up/anonymous sign-in; Data API Exposed schemas chỉ cho schema cần thiết, không private. Không tạo task-documents bucket trước migration vì file đã quản lý bucket.
2. Sau khi được phép kết nối, xem `verification/preflight.sql` và chạy trên project đích ở chế độ read-only. Nếu có application tables/role/bucket/policies không rõ nguồn hoặc Auth users có sẵn, dừng review trước, không drop để tiếp tục. File chỉ đọc catalog, không sửa DB.
3. CLI chưa được cài ở Bước 2.2. Khi được duyệt, cài project-local bằng npm, ghi nhận version và lockfile. Không dùng npm global, không cài Docker/local Supabase stack:

```powershell
npm install --save-dev --save-exact supabase
npx supabase --version
npx supabase login
npx supabase link --project-ref PROJECT_REF_THU_NGHIEM
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

`PROJECT_REF_THU_NGHIEM` là placeholder phải thay đúng project. Đăng nhập/DB password qua cơ chế nhập bảo mật của CLI; không truyền password/token trong câu lệnh hoặc chat/repo. URL và publishable key chỉ cần ở bước nối React, không đủ quyền chạy migration. CLI dùng quyền quản trị database, không dùng publishable key.

4. Review dry-run: đúng sáu versions ở mục 1, đúng linked project. Dry-run không chứng minh SQL compile hoặc RLS đúng; nó vẫn liên hệ Cloud nên cũng chưa chạy ở bước này. Lệnh thực thi chỉ dùng **sau phê duyệt chạy migration**:

```powershell
npx supabase db push --linked
npx supabase migration list --linked
```

Không `--include-all`, `migration repair`, `db reset`, `config push`, deploy/push GitHub hoặc chạy SQL Editor thay workflow khi chưa có yêu cầu riêng. Không nhúng transaction thủ công vào migration. CLI ghi version vào `supabase_migrations.schema_migrations`; không sửa migration đã apply. Migration lỗi rollback file hiện tại; các version trước đã thành công vẫn còn. Sửa bằng migration/hướng xử lý đã review, không giả định cả sáu file rollback chung.

5. Sau apply, chạy `verification/post_migration.sql` (read-only) và kiểm tra RLS/grants/owners/index/bucket. Kỳ vọng fresh project: 11/3/3 catalog, tasks/user_roles/profiles rỗng, audit có sự kiện seed; không Admin thật. Kiểm tra Dashboard Security Advisors và quyền Storage.
6. SQL tests ở `tests/` cần được duyệt chạy riêng trên **database thử nghiệm dùng để kiểm thử và có thể loại bỏ**, không chạy trên project có dữ liệu thật. Đây là plain SQL assertions, không phải pgTAP; chạy nguyên file bằng SQL Editor/kết nối SQL thích hợp đã được duyệt, dừng khi lỗi và ROLLBACK phiên lỗi. Không tự đưa chúng vào lệnh seed hoặc `supabase test db` mà giả định là pgTAP.

Test `001` impersonates anon/authenticated cùng JWT fixtures để kiểm tra đủ bốn role, role rỗng, inactive, anonymous Auth, tự nâng quyền, CRUD/progress/complete/version/idempotency/KPI/date boundaries. Test `002` dùng SET ROLE executor **chỉ từ owner test runner** để kiểm tra thân hàm GĐ3 đang khóa với client, constraint deferred, file/transaction rollback, pending/approve/reject và đôn đốc chung; fixtures Storage chỉ là metadata giả định, không test API tải file. Mọi fixtures trong BEGIN...ROLLBACK; sequence có thể tăng dù rollback, nên chỉ dùng database kiểm thử. Chưa chạy các tests này.

Sau khi chạy test DB ở bước sau, còn phải kiểm tra REST/Auth JWT và Storage upload/download/signed URL thực tế, hai session đồng thời, restore DB + file; không nghiệm thu toàn bộ bằng SQL Editor quyền owner. Chưa tạo Admin hoặc phát triển frontend service ở Bước 2.2.

Nguồn: [CLI db push](https://supabase.com/docs/reference/cli/supabase-db-push), [migration workflow](https://supabase.com/docs/guides/deployment/database-migrations), [Supabase functions](https://supabase.com/docs/guides/database/functions).
