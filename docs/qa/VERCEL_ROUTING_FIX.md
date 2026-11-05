# Sửa lỗi 404 khi tải lại trang trên Vercel

## Nguyên nhân đã kiểm tra

- Website được người dùng cung cấp: `https://theo-doi-nhiem-vu.vercel.app`.
- Đọc HTTP thực tế trước khi sửa: `/` trả **200**, `/tong-quan` trả **404**.
- Frontend dùng React Router `BrowserRouter`, điều hướng ở trình duyệt. Khi tải lại hoặc mở link trực tiếp, Vercel nhận request đến `/tong-quan`, `/nhiem-vu`, `/can-don-doc`, `/bao-cao`, `/danh-muc`, `/dang-nhap`; các đường dẫn này không phải file tĩnh trong `dist`.
- Chưa có `vercel.json` trong dự án nên Vercel chưa có SPA fallback. Lỗi xảy ra trước khi React được tải, không liên quan Supabase/migration.

## Bản sửa

Thêm `vercel.json` ở root repository: framework Vite, build `npm run build`, output `dist`, rewrite `/(.*)` về `/index.html` theo [hướng dẫn SPA của Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

Giữ BrowserRouter và các URL hiện có; không đổi UI, trạng thái DEMO, dữ liệu hoặc schema Supabase. File cấu hình phải nằm trong Root Directory mà Vercel build (dự án này là root repository), không chỉ tải thư mục dist bỏ qua cấu hình.

## Kiểm tra local đã thực hiện

- `npm run build`: thành công; chỉ còn cảnh báo kích thước bundle đã có.
- Microsoft Edge headless trên Vite preview của bản production build: mở trực tiếp và reload cả sáu đường dẫn, có query string, ở 1366×768 và 390×844. Đủ 12 trường hợp đều HTTP 200, React/login DEMO hiển thị; không ghi nhận pageerror.
- Đăng nhập DEMO và chuyển đủ năm trang trên cả hai viewport hoạt động.
- Các kiểm tra trên chứng minh bản build chạy được ở local; Vite preview có SPA fallback riêng, không thực thi `vercel.json`. Hiệu lực rewrite trên Vercel phải kiểm tra sau khi deployment mới chứa cấu hình hoàn tất.

## Áp dụng lên website sau khi được phép

1. Commit/push riêng bản sửa cấu hình và hướng dẫn này; không đưa các migration chưa được phép áp dụng lên database. Push Git không tự chạy SQL, nhưng phải kiểm tra pipeline của project nếu có thay đổi ngoài phạm vi.
2. Trong Vercel, chọn đúng project gắn domain trên, repo/production branch đúng, Root Directory là root dự án; build `npm run build`, output `dist`.
3. Nếu Git integration tự build thì chờ deployment mới **Ready**. Nếu không, chọn Redeploy bản commit chứa `vercel.json`. Redeploy commit cũ thiếu file này sẽ không sửa lỗi.
4. Mở trực tiếp từng đường dẫn và F5/Ctrl+R; đường dẫn phải trả nội dung ứng dụng thay cho trang Vercel 404. Kiểm tra thêm asset JS/CSS/font/ảnh tải đúng.

Lưu ý: login và dữ liệu hiện vẫn là UI DEMO trong bộ nhớ. Tải lại có thể quay về login DEMO và khôi phục dữ liệu minh họa theo hành vi đã thiết kế; bản sửa routing không triển khai đăng nhập/persistence thật.

Chưa push hoặc redeploy trong lượt sửa local; chưa xác nhận bản live đã nhận cấu hình mới. Kiểm tra Vite preview local không thay thế nghiệm thu routing trên Vercel sau triển khai.
