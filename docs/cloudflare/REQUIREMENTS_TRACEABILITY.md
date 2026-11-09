# ĐỐI CHIẾU TOÀN BỘ MASTER PROMPT CLOUDFLARE

> **B1.2, 09/11/2026:** D1 TEST `theodoinhiemvu-d1-test` (UUID `649fd0db-7fd3-4551-bfac-f3fccc408373`) đã áp dụng đủ 5 migration. Có 20 bảng ứng dụng, đúng seed 11/3/3; không profile/task/tenant A/B. FK check và quick_check đạt; integrity_check bị D1 từ chối SQLITE_AUTH, không đánh dấu đạt. Chỉ chuẩn bị binding Preview local, chưa push/deploy/Auth/R2. [Báo cáo B1.2 và hướng dẫn Preview](../qa/D1_B1_2.md). Các trạng thái B1/A.2 cũ bên dưới là lịch sử trước B1.2.

> **Trạng thái mới nhất 09/11/2026:** Bảng A/A.2 bên dưới là snapshot lịch sử. A/Preview đã nghiệm thu; B1 local đã triển khai theo phê duyệt mới, chi tiết đối chiếu ở cuối file và [thiết kế B1](D1_B1.md). B2–E chưa triển khai.

Ngày đồng bộ: 06/11/2026. Nguồn là [master đã hợp nhất](MASTER_PROMPT.md) đủ 10 mục và [yêu cầu Worker mới nhất](STAGE_A_WORKERS_REQUEST.md), thay phần Pages trước đây; [kế hoạch hiện hành](../IMPLEMENTATION_PLAN.md) đã thay nội dung cũ. Tài liệu hóa một yêu cầu **không có nghĩa đã lập trình yêu cầu đó**.

Trạng thái: **Đã làm A** = có mã/bằng chứng kiểm thử local; **Giữ UI mock** = hiện có và được bảo toàn, chưa dữ liệu thật; **Chuẩn bị** = có contract/example/service nhưng chưa kết nối dịch vụ; **Chưa làm B/C/D/E** = đã đưa vào kế hoạch, chưa triển khai và chưa được phép tự bắt đầu.

## Mục 1 — Bối cảnh và nền tảng

| ID | Yêu cầu | Đối chiếu hiện tại | Trạng thái |
|---|---|---|---|
| M01.1 | Tích hợp vào TheoDoiNhiemVu hiện có; giữ repo và Vercel | Nhánh `feature/cloudflare-worker-stage-a`, không frontend mới, không đổi Vercel Production | Đã làm A |
| M01.2 | React/TS/Vite/Ant Design, Workers Static Assets + Worker API | `wrangler.jsonc`, `worker/index.ts`, toàn bộ UI hiện có | Đã làm A |
| M01.3 | D1 nghiệp vụ, R2 private, Supabase Auth nếu phù hợp | Kế hoạch mục 2–5, `server/env.ts`, mẫu binding; chưa resource/identity thật | Chuẩn bị / chưa làm B–D |
| M01.4 | Không tự phát triển/lưu mật khẩu | Chưa có password DB/hệ thống password tự viết; quy trình provider được ghi vào B/C | Giữ nguyên, tiếp tục ràng buộc B/C |

## Mục 2 — Local, Git và bảo toàn

| ID | Yêu cầu | Bằng chứng | Trạng thái |
|---|---|---|---|
| M02.1 | Kiểm tra local mới nhất, so GitHub, ưu tiên local chưa push | Trước A HEAD/origin main cùng `ad95f59`, không ghi đè local | Đã làm A |
| M02.2 | Backup, branch riêng, checkpoint | ZIP 136 file/CRC/hash ở [báo cáo A](../qa/CLOUDFLARE_WORKERS_STAGE_A.md), checkpoint `408cfac`, tích hợp `2e17c3c` | Đã làm A |
| M02.3 | Giữ Design System/login/Dashboard/table/form/Drawer/lịch/TreeView nếu có | Các component UI giữ nguyên, 7 bài UI cũ đạt; TreeView và âm lịch chưa tồn tại ở A | Giữ UI mock; TreeView ở C |
| M02.4 | Không xóa dữ liệu, migration remote, Production/Vercel khi chưa duyệt | Không thực hiện trong A; các lệnh README là hướng dẫn, không lịch sử deploy | Đã tuân thủ, tiếp tục ràng buộc |

## Mục 3 — Frontend, API, database, storage

| ID | Yêu cầu | Đối chiếu | Trạng thái |
|---|---|---|---|
| M03.1 | Lớp `src/services/api.ts` gọi `/api`, không frontend truy cập binding | Service cùng origin đã tạo, có test; UI chưa dùng DB/R2 binding | Đã làm A |
| M03.2 | Dần thay DemoProvider và dữ liệu bộ nhớ | Kế hoạch B/D; `src/store.tsx` vẫn mock, login giữ nguyên | Chưa làm B/D |
| M03.3 | Worker API TypeScript, modules, middleware Auth/quyền | `worker/index.ts` và helpers, health/router boundary có thật; chưa JWT/membership/RBAC | Đã làm phần hạ tầng A; Auth ở B |
| M03.4 | D1 SQLite versioned migration, không dùng PostgreSQL nguyên trạng | Đã quy định `cloudflare/d1/migrations` cho B; **chưa tạo schema/migration D1**; Supabase SQL giữ lịch sử | Chưa làm B |
| M03.5 | Batch/transaction an toàn, audit/version/idempotency | Điều kiện thiết kế/nghiệm thu B/D; chưa transaction D1 | Chưa làm B/D |
| M03.6 | R2 private, metadata D1, file tải có quyền, không public URL | Contract `DOCUMENTS` và kế hoạch R2/API; chưa upload/download thật | Chuẩn bị / chưa làm D |

## Mục 4 — Đa Tenant và mọi đường truy cập

| ID | Yêu cầu | Đối chiếu | Trạng thái |
|---|---|---|---|
| M04.1 | Mỗi cơ quan tenant riêng, dữ liệu/cơ cấu/user/report/file riêng | Kế hoạch mục 3; hiện UI vẫn Hương Đô DEMO, không có tenant switcher thật | Chưa làm B–D |
| M04.2 | tenants/organization_units/profiles/memberships/member_roles/unit_assignments | Tất cả bảng được liệt kê và xác định phạm vi ở kế hoạch; chưa D1 DDL | Chưa làm B |
| M04.3 | tasks/documents/progress/expedite/links/extensions/attachments/audit/import jobs/rows | Toàn bộ bảng trong kế hoạch; thêm leaders/sources/coordinators cho V1.3 | Chưa làm B/D |
| M04.4 | tenant_id, composite FK/index/unique/check, chống chéo tenant | Quy định quan hệ cha/liên kết, unit assignment và các ca A/B ở kế hoạch/prompt B | Chưa làm B |
| M04.5 | D1 không có PostgreSQL RLS | Prompt/kế hoạch hiện hành đã thay Supabase RLS bằng Worker API + D1 constraints; không apply SQL cũ | Đã đồng bộ thiết kế; chưa backend quyền |
| M04.6 | 6 kiểm tra ở mọi API: identity, membership, tenant, role, record scope, audit | Đã ghi đầy đủ, gồm cả đọc/ghi/KPI/report/export/import/download; A chỉ mở health, route khác JSON 404 | Chưa làm B–D; A đóng endpoint chưa có |

## Mục 5 — Vai trò, tài khoản, chuyển tenant

| ID | Yêu cầu | Đối chiếu | Trạng thái |
|---|---|---|---|
| M05.1 | Super Admin quản trị tenant/Tenant Admin/tình trạng/cấu hình nền tảng | Ma trận mới và prompt B/C, không giữ ADMIN đơn cơ quan cũ làm quyền toàn nền tảng | Chưa làm B/C |
| M05.2 | Super Admin không mặc định xem nghiệp vụ nội bộ tenant | Đã ghi rõ trong kế hoạch và test âm bắt buộc B/E | Chưa làm B/E |
| M05.3 | Tenant Admin TreeView/cơ cấu, add/edit/inactive unit | Kế hoạch C và prompt C riêng | Chưa làm C |
| M05.4 | Create user/invite/roles/revoke/lock/reset/audit tenant | Kế hoạch C dùng provider Admin API phía server, không password thủ công | Chưa làm C |
| M05.5 | Office Editor ghi, Office Confirmer xác nhận/kết quả gia hạn, Leader Viewer chỉ đọc | Ma trận hiện hành; UI chỉ hai vai trò trải nghiệm, chưa RBAC thật | Chưa làm B/D |
| M05.6 | Một identity nhiều tenant, chuyển context rõ và không lẫn cache/quyền | Membership model, quy tắc xóa cache/tải lại quyền và test trong B/C/E | Chưa làm B/C/E |

## Mục 6 — Bảo toàn nghiệp vụ

| ID | Yêu cầu | Hiện tại | Chặng dữ liệu thật |
|---|---|---|---|
| M06.1 | Ba nguồn, một chủ trì/nhiều phối hợp, lãnh đạo | UI/domain và CSV đúng Hương Đô | B/D chưa làm |
| M06.2 | Hạn gốc bất biến, hạn hiệu lực theo quyết định approved | Có thuật toán/guard trong UI mock; chưa D1/backend | B/D chưa làm |
| M06.3 | 3–5 nguy cơ, 0–2 khẩn, <0 quá hạn, ba trục trạng thái | Có domain tests và mock UI; không coi đó là backend enforcement | B/D chưa làm |
| M06.4 | Đôn đốc văn bản, một văn bản nhiều task, count không nhân khi sửa | Mock và test UI có; chưa văn bản D1/R2 | D chưa làm |
| M06.5 | Pending/rejected không đổi hạn, nhiều lần tuần tự/một pending | Mock và tests có; quy tắc ghi vào thiết kế D1/D | B/D chưa làm |
| M06.6 | Hoàn thành có ngày thực tế/kết quả/quyền, snapshot và đúng/chậm | Mock và domain/UI test có; quyền server và persistence chưa có | B/D chưa làm |
| M06.7 | KPI DISTINCT ID, báo cáo theo chủ trì | Mock tính động; không hardcode; chưa thống kê D1 | D chưa làm |
| M06.8 | Import Excel preview/error/duplicate và audit | Wizard mô phỏng, chưa đọc workbook thật; timeline chưa audit DB | B/D chưa làm |
| M06.9 | Backend thực thi nghiệp vụ, không chỉ frontend | Mọi quy tắc đưa vào nghiệm thu D; health A chưa là backend nghiệp vụ | D chưa làm |

## Mục 7 — Các file và chuyển đổi UI

Đã đọc/kiểm tra `src/App.tsx`, `src/store.tsx`, `src/demo.ts`, `src/domain.ts`, `src/pages.tsx`, `src/components/Login.tsx`, `TaskForms.tsx`, `TaskDrawer.tsx`, `ImportWizard.tsx`, `BusinessClock.tsx` khi tích hợp A. Component/Design System/nghiệp vụ được bảo toàn. Thay login thật, dữ liệu API và tenant context thuộc B–D; chưa thực hiện. Ngày/tháng/giờ Việt Nam giữ nguyên. Âm lịch chưa được thêm; nếu triển khai phải tính/kiểm thử đúng.

## Mục 8 — Cấu hình Workers và môi trường

| ID | Yêu cầu | Hiện tại | Trạng thái |
|---|---|---|---|
| M08.1 | Workers Static Assets + Worker API theo yêu cầu mới | `main`, `assets`, `ASSETS`, SPA fallback; không tạo Pages Project | Đã làm A |
| M08.2 | D1/R2 bindings và server secrets | Env contract/mẫu không active; chưa resource ID/keys; secrets theo B–D | Chuẩn bị |
| M08.3 | SPA, API chạy Worker trước kể cả navigation, static không chạy Worker thừa | `assets.run_worker_first`, workerd/browser test; API miss JSON 404 | Đã làm A |
| M08.4 | Development/staging/Production độc lập | Vars đã tách; chưa tạo môi trường/tài nguyên Cloud; không đồng nghĩa đã cách ly DB thật | Cấu hình A, thực thi B/E |

## Mục 9 — Tiến độ A–E

| Chặng | Tình trạng thực tế |
|---|---|
| A | Đã kiểm tra local/GitHub, ZIP/branch/checkpoint, công cụ project, Worker/health/service/UI; build và test đã đạt; chờ nghiệm thu |
| B | Chưa D1 schema/migration/seed, Auth thật, test tenant A/B, Super Admin bootstrap |
| C | Chưa tenant/cơ cấu TreeView, tài khoản/quyền/invite/reset/revoke UI/API |
| D | Chưa CRUD/report/đôn đốc/gia hạn/import/export/R2 dữ liệu thật |
| E | Chưa nghiệm thu hệ thống dữ liệu thật, restore D1+R2, Preview thực tế hoặc Production |

## Mục 10 — Phạm vi được phép ở lượt master

Master yêu cầu **chỉ A**, cho phép file cấu hình/API mẫu/service/dependency project, giữ login DEMO; cấm remote migration/Production/đổi Vercel và yêu cầu dừng trước B. Bằng chứng A tại [báo cáo](../qa/CLOUDFLARE_WORKERS_STAGE_A.md): build/typecheck/Worker dry-run, 28 unit + 9 browser tests, health/frontend chung origin; [URL/hướng dẫn/Dashboard](README.md).

Lượt Chặng A Worker này có sửa code/config/service/test và đồng bộ tài liệu. Build, unit test, HTTP và browser test chạy trên Worker/workerd thực tế; bằng chứng tại [báo cáo mới](../qa/CLOUDFLARE_WORKERS_STAGE_A.md). Không tạo D1/Auth/R2, không thực hiện B–E hoặc push/deploy. Báo cáo Pages cũ là lịch sử. Không đánh dấu B–E hoàn thành chỉ vì đã đưa vào kế hoạch.

## Bổ sung A.2 — Worker Previews

Wrangler 4.157.0 đã hỗ trợ Previews; thay env.preview bằng previews thật, command wrangler preview --ignore-base-config; chưa tài nguyên/secrets. Nhánh feature/cloudflare-worker-stage-a, kiểm tra và commit local. Chưa đăng nhập Cloudflare hoặc xác minh Dashboard Builds nên chưa push, chưa URL và chưa test Cloud Preview. [Hướng dẫn](WORKER_PREVIEWS_A2.md), [báo cáo A.2](../qa/CLOUDFLARE_WORKER_PREVIEWS_A2.md). Không đánh dấu A.2 hoàn tất từ kết quả local.

## B1 — Phê duyệt mới, đã kiểm thử D1 local

| Yêu cầu | Bằng chứng B1 | Chưa làm |
|---|---|---|
| Database SQLite đa tenant | 5 migrations/20 bảng; FK ghép/immutability/STRICT; không PostgreSQL | Cloud migration |
| Seed Hương Đô | Đối chiếu đúng CSV 11/3/3; profiles/tasks bằng 0 trong DB danh mục | Auth accounts/dữ liệu thật |
| TreeView/cô lập A/B | Parent FK/recursive trigger; 30 integration D1/workerd, batch rollback/persistence | TreeView UI/API C |
| Role và platform riêng | Guard nội bộ + capability/DAL, 34 unit đạt, thiếu verifier từ chối; Super Admin không đọc task mặc định | JWT/Auth B2 và public CRUD |
| Bảo toàn A | 9 UI/API regression đạt; root Worker/config/UI giữ nguyên | UI dữ liệu thật |
| TEST Preview riêng | Hai mẫu config, DB giả chỉ local, hướng dẫn Dashboard | DB TEST Cloud chưa tạo/gắn/migrate |

[Báo cáo B1](../qa/D1_B1.md). Dừng trước remote migration và B2/C; không coi test verifier fixture là Auth thật.
