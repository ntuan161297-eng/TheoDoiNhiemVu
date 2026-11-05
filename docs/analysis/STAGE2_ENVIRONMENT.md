# GIAI ĐOẠN 2 — KẾT QUẢ BƯỚC 2.1: MÔI TRƯỜNG VÀ SAO LƯU

Ngày kiểm tra: 05/11/2026, giờ Việt Nam. Chủ sản phẩm đã cho phép Giai đoạn 2 trong file yêu cầu đính kèm. Quy định mới này thay thế giới hạn “chưa triển khai Chặng 2” của kế hoạch trước; vẫn cần xác nhận riêng trước khi cài phần mềm hệ thống hoặc thay đổi cấu hình máy.

**Trạng thái: chưa đủ điều kiện môi trường; dừng ở Bước 2.1 để chủ sản phẩm chọn máy phù hợp và phê duyệt việc cài đặt. Chưa bắt đầu Bước 2.2–2.5.**

## 1. Kết quả kiểm tra thực tế

| Hạng mục | Kết quả |
|---|---|
| Windows | Windows 10 Pro 1909, build 18363.1556; thông tin đọc từ registry hệ điều hành |
| Node.js | 22.14.0 |
| npm | 10.9.2; lệnh đọc phiên bản cần chạy ngoài sandbox vì đường dẫn Node bị chặn đọc trong sandbox |
| Git | 2.56.0.windows.1 |
| .NET 10 SDK | Chưa có; `dotnet --list-sdks` rỗng; không có thư mục SDK ở cả Program Files x64/x86 |
| .NET hiện có | Host 8.0.31; ASP.NET Core Runtime 8.0.21; .NET Runtime 8.0.21/8.0.31; Desktop Runtime 8.0.31. Runtime không thay SDK để biên dịch |
| SQL Server/Express | Chưa phát hiện dịch vụ MSSQL/SQLAgent/SQLBrowser, instance SQL ở registry x64/x86 hoặc sản phẩm SQL Server đã đăng ký cài đặt |
| Công cụ SQL | Không tìm thấy `sqlcmd`, `sqllocaldb`, `ssms` trong PATH; không phát hiện sản phẩm SSMS qua registry cài đặt và các thư mục chuẩn đã kiểm tra |
| Winget/Docker | Không có trong PATH; không dùng làm giải pháp tự động thay thế |

Không kết luận về SQL Server ở máy khác vì chưa được cung cấp địa chỉ hoặc instance. Chưa thử kết nối database bên ngoài.

## 2. Điểm tương thích cần giải quyết trước

Máy đang chạy Windows 10 **Pro 1909**, không thuộc bảng hệ điều hành được Microsoft liệt kê hỗ trợ cho .NET 10 hiện tại. Tài liệu hiện giới hạn hỗ trợ Windows 10 ở một số bản LTSC/Enterprise; không được hiểu “Windows 10” là mọi bản/edition. Đây là vấn đề về nền tảng được hỗ trợ, không phải khẳng định kỹ thuật rằng bộ cài chắc chắn không thể chạy. [Microsoft: .NET trên Windows](https://learn.microsoft.com/en-us/dotnet/core/install/windows).

SSMS 22 hiện liệt kê Windows 11 và Windows Server 2019/2022/2025 trong các hệ điều hành hỗ trợ. [Microsoft: yêu cầu hệ thống SSMS](https://learn.microsoft.com/en-us/ssms/system-requirements).

Đề xuất dùng máy hoặc VM **Windows 11 x64 còn trong hỗ trợ**, hoặc một máy chủ Windows Server phù hợp. Chưa kiểm tra điều kiện phần cứng/bản quyền/nâng cấp Windows của máy hiện tại, chưa cài hoặc tạo VM, chưa thay đổi hệ điều hành.

## 3. Sao lưu frontend đã hoàn thành

- File: `backups/frontend-ui-before-stage2-2026-11-05-d12716bc.zip`.
- Kích thước: 15.729.481 bytes.
- Số file: 116.
- SHA-256: `1FC0730FE4807EE0F2B5730D0865296338062ECD5ACE875735BAAAF5D559AF6A`.
- Bao gồm mã nguồn, package/lockfile, cấu hình, font/theme/component, ảnh nền, tài liệu sản phẩm, CSV/Excel mẫu, tài liệu nghiệm thu, ảnh chụp và test.
- Không bao gồm dependency cài sẵn, bản build, test-results, Git metadata, `.env*` hoặc tsbuildinfo.
- Đã mở lại ZIP để kiểm tra số entry và sự hiện diện của App/domain/store, package/lockfile, ảnh nền và CSV đơn vị. Chưa thực hiện khôi phục đè lên dự án đang dùng.
- Dùng bản sao lưu thay cho commit vì workspace hiện không có repository Git được khởi tạo. Không tạo commit/push. Thêm `backups/` vào `.gitignore` để giữ archive local.

Khi cần khôi phục, giải nén sang thư mục mới để kiểm tra trước; không ghi đè phiên bản đang làm. Sau đó `npm ci` và `npm run build` trên môi trường có Node phù hợp.

## 4. Bộ công cụ đề xuất và hướng dẫn cài sau khi được duyệt

Chỉ áp dụng các bước dưới đây sau khi đã chọn máy có hệ điều hành được hỗ trợ và chủ sản phẩm/IT đồng ý cài. Chưa chạy các bước cài đặt.

### A. .NET 10 SDK

1. Mở [trang tải .NET 10 chính thức](https://dotnet.microsoft.com/en-us/download/dotnet/10.0).
2. Chọn **SDK**, bản ổn định mới nhất thuộc .NET 10, **Windows x64 Installer**. Không chỉ chọn ASP.NET Core Runtime hoặc Desktop Runtime.
3. Cài bằng bộ cài Microsoft; không cần tự cài Visual Studio đầy đủ để dùng CLI. Không gỡ runtime 8 đang phục vụ ứng dụng khác.
4. Mở terminal mới, kiểm tra:

```powershell
dotnet --info
dotnet --list-sdks
```

Phải xuất hiện SDK `10.0.xxx`. Phiên bản patch chính xác sẽ được ghi nhận sau khi cài rồi ghim bằng global.json cho dự án.

### B. SQL Server Express

1. Dùng [trang tải SQL Server chính thức](https://www.microsoft.com/en-us/sql-server/sql-server-downloads), chọn **SQL Server 2025 Express** cho môi trường mới phù hợp. Nếu cơ quan đã có SQL Server được hỗ trợ, ưu tiên kiểm tra và dùng instance được chỉ định thay vì cài trùng.
2. [Đối chiếu yêu cầu phần cứng/hệ điều hành SQL Server 2025](https://learn.microsoft.com/en-us/sql/sql-server/install/hardware-and-software-requirements-for-installing-sql-server-2025?view=sql-server-ver17) trên máy được chọn trước khi cài.
3. Chọn Database Engine và instance `SQLEXPRESS` nếu tên này chưa được dùng. Ghi lại tên instance thực tế; không thay cấu hình của một instance có sẵn.
4. Môi trường phát triển local ưu tiên Windows Authentication, không tạo tài khoản `sa`/mật khẩu trong mã nguồn. Quyền database của ứng dụng sẽ được thiết kế riêng ở bước backend.
5. Theo giới hạn dữ liệu của chủ sản phẩm, cấu hình đường dẫn data/log/backup của database dự án trong vùng thuộc workspace, ví dụ `.local/sql-data`, `.local/sql-backups`, sau khi xác nhận quyền của tài khoản dịch vụ SQL. Phần mềm hệ thống và service vẫn có thay đổi ngoài workspace nên phải được phê duyệt riêng.
6. Chưa mở firewall hoặc truy cập ngoài máy. Chưa tự tạo database bằng tay; database của ứng dụng sẽ được tạo bằng EF Core Migration ở bước tiếp theo.

### C. SQL Server Management Studio

1. Mở [hướng dẫn cài SSMS chính thức](https://learn.microsoft.com/en-us/ssms/install/install), dùng SSMS 22 trên hệ điều hành được hỗ trợ.
2. Cài bằng `vs_SSMS.exe` của Microsoft. SSMS là công cụ quản lý, không thay cho SQL Server Database Engine.
3. Kết nối `localhost\SQLEXPRESS` bằng Windows Authentication nếu đó là instance đã chọn.
4. Kiểm tra phiên bản server, khả năng kết nối và vị trí dữ liệu trước khi chạy migration. Không gửi mật khẩu hoặc connection string có bí mật vào chat/repo.

## 5. Frontend và tài liệu đã đối chiếu

- Dự án React 18/TypeScript/Vite/Ant Design/Recharts đang nằm ngay tại workspace; không tạo ứng dụng mới.
- Có theme Be Vietnam Pro/Lucide, năm trang nghiệp vụ, login, drawer/form/import mock và bộ kiểm thử.
- Dữ liệu hiện ở `src/store.tsx`/`src/demo.ts`; `DemoProvider` giữ trong bộ nhớ. Chưa có backend hoặc client gọi API thật.
- Đã đối chiếu hướng dẫn ưu tiên, PRD/UX V1.3, business rules, test V1.2/V1.3 và kế hoạch đã lưu; V1.3 tiếp tục ưu tiên khi mâu thuẫn.
- Yêu cầu Giai đoạn 2 đã chốt .NET 10 + Identity + EF Core + SQL Server; không tự hạ .NET hoặc đổi sang SQLite.
- Giai đoạn 2 chỉ thiết kế để mở rộng đôn đốc/gia hạn/import về sau; không triển khai đầy đủ Giai đoạn 3.

## 6. Điều kiện tiếp tục

Cần chủ sản phẩm chọn một trong hai hướng:

1. Chuẩn bị máy/VM Windows 11 x64 được hỗ trợ và chấp thuận cài .NET 10 SDK, SQL Server Express, SSMS.
2. Chỉ định môi trường phát triển/backend đã có .NET 10 SDK và instance SQL Server của cơ quan; cần thông tin máy/instance và cách truy cập an toàn, không cần gửi bí mật trong chat.

Sau khi môi trường được xác nhận, tiếp tục theo thứ tự 2.2–2.5: backend/schema/migrations/seed danh mục → API/OpenAPI → Identity/cookie/CSRF/quyền server → nối frontend và kiểm thử persistence. Chỉ seed danh mục 11/3/3, không đưa nhiệm vụ DEMO vào database thật.

**Chưa cài phần mềm, thay đổi cấu hình máy, viết backend, tạo database, sửa UI, deploy hoặc push.**
