# Theo dõi nhiệm vụ — UBND xã Hương Đô

**Chặng A — đã tích hợp Cloudflare Pages và Pages Functions local.** Giữ UI MOCK React + TypeScript + Vite + Ant Design + Recharts, Be Vietnam Pro và Lucide. Có API hạ tầng `/api/health`; login/nghiệp vụ vẫn DEMO trong bộ nhớ, chưa có Auth thật, D1, R2 hoặc phân quyền đa Tenant. [Hướng dẫn local/Cloudflare Preview](docs/cloudflare/README.md), [báo cáo kiểm tra](docs/qa/CLOUDFLARE_STAGE_A.md).

Xem [báo cáo nâng cấp và ảnh mới](docs/qa/UI_UX_UPGRADE.md). Phong cảnh nền là ảnh minh họa được tạo, không phải ảnh xác thực địa điểm/trụ sở xã; [prompt và nguồn gốc](public/assets/README.md).

## Mở ứng dụng

Trong PowerShell tại thư mục dự án:

```powershell
cd D:\ubnd-huong-do-tasks
npm run dev:pages
```

Mở **http://127.0.0.1:8788/**; API **http://127.0.0.1:8788/api/health**. Chọn **Cán bộ Văn phòng** hoặc **Lãnh đạo**, rồi bấm **Vào giao diện DEMO**. Không cần tài khoản/mật khẩu thật. Hai ô tài khoản trên màn hình chỉ là minh họa. `npm run dev` vẫn mở riêng Vite tại 5173 khi cần hot reload.

Nếu mới tải dự án hoặc chưa có node_modules, chạy `npm ci` trước. Node.js hiện tại 22.14.0 đã chạy được bản này. Không cần .NET SDK hoặc SQL Server cho Chặng 1.

## Những gì có thể kiểm tra

- Năm trang qua menu ngang: Tổng quan, Nhiệm vụ, Cần đôn đốc, Báo cáo đơn vị, Danh mục.
- 18 nhiệm vụ minh họa, đúng 11 đơn vị/3 lãnh đạo/3 nguồn đọc từ các CSV sản phẩm. Ngày mẫu sinh tương đối theo ngày Việt Nam khi mở phiên.
- Sáu KPI và biểu đồ tính từ dữ liệu; lọc theo nguồn/chủ trì/lãnh đạo/năm và bộ lọc nâng cao. Bấm KPI hoặc ô báo cáo để drill-down, bộ lọc nằm trong URL.
- Thêm/sửa nhiệm vụ; ghi tiến độ; xác nhận hoàn thành với ngày thực tế/kết quả và snapshot hạn. Nhập 100% không tự hoàn thành.
- Drawer năm tab Thông tin/Tiến độ/Đôn đốc/Gia hạn/Lịch sử.
- Chọn nhiều nhiệm vụ ở Cần đôn đốc → ghi chung một văn bản. Thử sửa cùng bản ghi để kiểm tra số lượt không tăng.
- Nhiệm vụ đầu tiên có ba lần đôn đốc, đang quá hạn và đang xin gia hạn. Tab Gia hạn cho thử ghi kết quả chấp thuận/từ chối. Nhiệm vụ Trường Mầm non có một lần đã được duyệt và lần hai đang chờ.
- Import Excel ba bước: chọn kịch bản hợp lệ/lỗi/trùng. Có mẫu Excel V1.3 tải xuống. Việc chọn tệp chỉ hiển thị tên, **chưa phân tích Excel thật**.
- Báo cáo CSV theo dữ liệu đã lọc, gồm CSV tổng hợp đủ 11 đơn vị và CSV chi tiết. **Chưa xuất workbook báo cáo Excel**.
- Danh mục có công cụ thử loading/error/retry, khôi phục dữ liệu và một công tắc minh họa cấu hình.

## Giới hạn minh họa

Toàn bộ thao tác nhiệm vụ, file, lịch sử và vai trò nằm trong bộ nhớ trình duyệt. **Tải lại trang sẽ xóa thay đổi và khôi phục bộ mẫu.** Không dùng localStorage để giả lưu dữ liệu thật, không gửi văn bản hoặc dữ liệu đi dịch vụ ngoài.

Tệp được chọn dùng object URL trong phiên; các tài liệu có nhãn “mẫu” tải về TXT minh họa, không phải văn bản thực tế. Trong UI mock, cán bộ Văn phòng được thử cả nhập liệu và xác nhận. Chuyển vai trò chỉ phục vụ duyệt giao diện, không phải cơ chế bảo mật.

Chưa xử lý hủy/đính chính quyết định gia hạn đã áp dụng hoặc hồi tố gia hạn sau hoàn thành; đây là quyết định nghiệp vụ cần chốt trước Chặng 3.

## Kiểm tra

```powershell
npm run build
npm run test
npm run test:ui
```

- `build`: TypeScript strict + Vite production build.
- `test`: quy tắc ngày/hạn, gia hạn, snapshot, KPI, lọc và đếm đôn đốc.
- `test:ui`: Playwright dùng Microsoft Edge đã có trên máy, chạy headless. Nếu Edge ở vị trí khác, chỉnh `executablePath` trong `playwright.config.ts`. Không tự tải trình duyệt hoặc cài phần mềm hệ thống.
- Ảnh nâng cấp: `docs/qa/ui-upgrade/`; ảnh UI ban đầu: `docs/qa/screenshots/`. Báo cáo mới: `docs/qa/UI_UX_UPGRADE.md`; báo cáo Chặng 1 ban đầu: `docs/qa/UI_MOCK_ACCEPTANCE.md`.

## File và cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `docs/IMPLEMENTATION_PLAN.md` | Lưu kế hoạch đã được duyệt, ranh giới các chặng |
| `src/App.tsx`, `src/main.tsx` | Login DEMO, khung ứng dụng, điều hướng và theme |
| `src/design-system.ts` | Màu sắc và theme Ant Design dùng chung |
| `src/components/Login.tsx`, `BusinessClock.tsx`, `PageHeading.tsx`, `icons.tsx` | Nhận diện, đăng nhập, đồng hồ Việt Nam, tiêu đề và icon Lucide |
| `src/pages.tsx` | Năm trang, bộ lọc, bảng nhiệm vụ và tổng hợp |
| `src/domain.ts` | Kiểu dữ liệu, ngày Việt Nam, tính hạn, lọc/KPI |
| `src/demo.ts`, `src/store.tsx` | Seed minh họa và thao tác trong bộ nhớ |
| `src/components/` | Drawer, biểu mẫu, wizard và thành phần dùng chung |
| `src/files.ts` | Tải tệp trong phiên và CSV DEMO |
| `src/styles.css`, `public/favicon.svg` | Thiết kế responsive và nhận diện trung tính |
| `src/domain.test.ts`, `tests/ui/` | Kiểm thử quy tắc và trình duyệt |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `index.html`, `.gitignore` | Cấu hình, dependency khóa phiên bản và lệnh chạy |

Các tài liệu nghiệp vụ gốc trong `docs/product` được giữ nguyên; yêu cầu Cloudflare mới nhất thay phần công nghệ trong kế hoạch cũ. Mã UI tự viết, chỉ tham khảo ý tưởng bố cục `ntuan161297-eng/VanPhongSo`. Không thay Vercel Production trong lượt tích hợp này.

**Chưa bắt đầu Chặng B (D1 đa Tenant/Auth thật). Chờ chủ sản phẩm nghiệm thu Chặng A; không tự deploy hoặc chạy migration remote.**
