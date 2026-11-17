# DOPTECH — Technology for Everyone

**Đề tài:** Xây dựng website thương mại điện tử DopTech bán thiết bị công nghệ, tích hợp tư vấn và gợi ý sản phẩm.

DopTech là đồ án ngành **Hệ thống Thông tin**, tập trung xây dựng hệ thống hỗ trợ quy trình bán lẻ thiết bị công nghệ: quản lý dữ liệu và phân quyền; tra cứu, so sánh sản phẩm; giỏ hàng, voucher, đơn hàng, thanh toán mô phỏng và tồn kho; đánh giá, báo cáo; tư vấn sản phẩm dựa trên dữ liệu thực trong SQL Server.

Về định vị đồ án, DopTech là **hệ thống thông tin hỗ trợ bán hàng và quản trị cửa hàng**, trong đó website là kênh giao dịch trực tuyến và AI hỗ trợ khách ra quyết định mua. Phần tư vấn hiện kết hợp luật nghiệp vụ với mô hình ngôn ngữ tùy cấu hình; đây không phải mô hình AI do đồ án tự huấn luyện.

## 1. Công nghệ

- **Frontend:** ReactJS, Vite, JavaScript, HTML5, CSS3, React Router, Axios, Bootstrap 5, Recharts.
- **Backend:** Node.js, Express.js, REST API, JWT, bcrypt, cors, dotenv, express-validator, mssql.
- **Cơ sở dữ liệu:** Microsoft SQL Server — database demo mặc định `DopTechDB`.
- **AI:** Bộ phân tích tiêu chí và gợi ý theo luật; có thể gọi OpenAI khi cấu hình `OPENAI_API_KEY`. Khi không có khóa hoặc dịch vụ AI lỗi, hệ thống vẫn có phương án trả lời theo luật và dữ liệu sản phẩm.

## 2. Kiến trúc thư mục

```text
doptech-ai/
├── backend/
│   ├── database/
│   │   ├── migrations/       # Migration bổ sung, giữ dữ liệu hiện có
│   │   ├── schema.sql        # Schema demo; dùng khi tạo/reset database demo
│   │   └── seed.sql          # Dữ liệu minh họa
│   ├── scripts/
│   │   ├── init-db.js
│   │   ├── migrate-db.js
│   │   └── seed-db.js
│   ├── src/
│   │   ├── ai/               # Phân tích yêu cầu và xếp hạng sản phẩm
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/       # Xác thực, phân quyền, giới hạn tần suất
│   │   ├── routes/
│   │   ├── services/         # Nghiệp vụ và giao dịch SQL
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env                # tạo cục bộ, không commit hoặc chia sẻ
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## 3. Yêu cầu cài đặt

1. Node.js 20 trở lên.
2. Microsoft SQL Server 2019/2022 hoặc SQL Server Express.
3. SQL Server Management Studio (SSMS) để quản trị và xem dữ liệu.
4. VS Code hoặc trình soạn thảo tương đương.

## 4. Cấu hình SQL Server

### Bật TCP/IP

1. Mở **SQL Server Configuration Manager**.
2. Chọn SQL Server Network Configuration → Protocols for instance đang dùng, ví dụ `SQLEXPRESS`.
3. Bật **TCP/IP** và kiểm tra cấu hình cổng trong TCP/IP Properties.
4. Khởi động lại dịch vụ SQL Server của instance đó.

### Cấu hình tài khoản SQL

Ứng dụng cần tài khoản SQL có thể kết nối và thao tác trên database DopTech. Chỉ cấp quyền tạo database nếu cần tạo database demo mới. Không nên dùng tài khoản quản trị SQL cho môi trường dùng thật.

### SQL Server Browser

Nếu kết nối bằng named instance như `SQLEXPRESS`, bật SQL Server Browser khi máy không phân giải được instance hoặc đang sử dụng cổng động.

## 5. Cấu hình `.env`

Tạo file `backend/.env` trong thư mục backend, sau đó điền thông tin SQL Server của máy. Ví dụ có thể tạo nhanh bằng PowerShell từ thư mục gốc:

```powershell
@'
PORT=4001
NODE_ENV=development
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_DATABASE=DopTechDB
DB_USER=sa
DB_PASSWORD=your_sql_password
DB_ENCRYPT=false
DB_TRUST_CERT=true
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
FRONTEND_URL=http://localhost:5173
'@ | Set-Content backend/.env
```

Ví dụ cấu hình:

```env
PORT=4001
NODE_ENV=development
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_DATABASE=DopTechDB
DB_USER=sa
DB_PASSWORD=your_sql_password
DB_ENCRYPT=false
DB_TRUST_CERT=true
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
FRONTEND_URL=http://localhost:5173
```

`JWT_SECRET` là bắt buộc, phải dài ít nhất 32 ký tự và cần được giữ riêng. Có thể tạo chuỗi ngẫu nhiên trên PowerShell bằng:

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Sao chép chuỗi được tạo vào `JWT_SECRET`. Không commit hoặc gửi file `.env` lên kho mã nguồn. Nếu dùng `DB_INSTANCE=SQLEXPRESS`, đặt `DB_SERVER=localhost`; không ghép instance vào `DB_SERVER` vì chương trình dùng cấu hình `instanceName` riêng.

## 6. Cài dependency

Từ thư mục gốc `doptech-ai`:

```powershell
npm install
npm run install-all
```

Lệnh `install-all` cài dependency riêng cho backend và frontend. Không cần cài lại `dotenv` nếu `backend/package.json` đã khai báo dependency này.

## 7. Tạo hoặc nâng cấp database

### Tạo database demo mới

Sau khi cấu hình SQL Server và `.env`, chạy:

```powershell
npm run db
```

Lệnh này tạo database nếu cần, dựng lại schema demo và nạp seed. **Schema demo có thao tác xóa rồi tạo lại các bảng; chạy trên database đã có dữ liệu sẽ làm mất dữ liệu đó.** Chỉ dùng khi khởi tạo/reset dữ liệu demo có chủ ý.

Schema hiện có 25 bảng, bao gồm dữ liệu tài khoản, danh mục, sản phẩm/thông số/ảnh, tồn kho và lịch sử kho, giỏ hàng, đơn, chi tiết đơn, thanh toán, voucher, đánh giá, thông báo, tương tác sản phẩm, lịch sử chat/gợi ý và lịch sử trạng thái đơn. Seed đi kèm dữ liệu minh họa cho việc demo; số lượng và giá trị cụ thể cần được đối chiếu với phiên bản `seed.sql` đang dùng.

### Nâng cấp database đã có dữ liệu

Không chạy `npm run db` để nâng cấp một database hiện hữu. Migration bổ sung các trường và bảng còn thiếu mà không reset dữ liệu:

```powershell
cd backend
node scripts/migrate-db.js
```

Migration cần chạy với đúng `DB_DATABASE` và tài khoản SQL có quyền ALTER/CREATE. Không cần chạy lại nếu bản DopTech đã áp dụng migration tương ứng.

## 8. Chạy toàn bộ project

Từ thư mục gốc:

```powershell
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4001`
- Kiểm tra backend và kết nối SQL: `http://localhost:4001/api/health`

Build frontend:

```powershell
npm run build
```

## 9. Tài khoản demo

Khi sử dụng dữ liệu seed mặc định:

| Vai trò  | Email                    | Mật khẩu       |
| -------- | ------------------------ | -------------- |
| Admin    | `admin@doptech.local`    | `Admin@123`    |
| Staff    | `staff@doptech.local`    | `Staff@123`    |
| Customer | `customer@doptech.local` | `Customer@123` |

Chỉ các tài khoản seed trong database demo mới có các thông tin này. Mật khẩu trong SQL là bcrypt hash, không lưu dạng văn bản thuần. Đổi vai trò hoặc khóa tài khoản sẽ thu hồi phiên cũ; người dùng cần đăng nhập lại.

## 10. Chức năng chính

### Customer

- Đăng ký, đăng nhập, đăng xuất; xem và cập nhật hồ sơ.
- Tìm, lọc, sắp xếp, phân trang sản phẩm; xem giá, tồn, ảnh, thông số và đánh giá.
- So sánh tối đa 3 sản phẩm; quản lý yêu thích và địa chỉ nhận hàng.
- Thêm/sửa/xóa giỏ; máy chủ kiểm tra số lượng theo tồn khả dụng.
- Checkout và áp voucher; máy chủ tính lại giá, phí giao hàng và tổng tiền.
- Chọn COD hoặc thanh toán ngân hàng/VNPay/MoMo **mô phỏng**.
- Xem lịch sử, chi tiết và tiến trình đơn; hủy đơn `PENDING`/`CONFIRMED` theo điều kiện.
- Đánh giá sản phẩm trong đơn `COMPLETED`; nhận thông báo; trò chuyện với DopTech AI.

### Staff

- Xem đơn hàng và cập nhật trạng thái theo trình tự được phép.
- Xem tồn kho và nhập kho.
- Không xem báo cáo doanh thu, không tự điều chỉnh giảm kho hoặc xác nhận thanh toán mô phỏng.

### Admin

- Dashboard vận hành và báo cáo doanh thu theo kỳ, giá trị trung bình đơn hoàn thành.
- Thêm/sửa/vô hiệu hóa sản phẩm; quản lý ảnh, thông số, danh mục và thương hiệu.
- Tạo nhân viên; quản lý trạng thái và vai trò tài khoản.
- Xem và cập nhật đơn, nhập/điều chỉnh kho, tra cứu lịch sử biến động.
- Tạo voucher; duyệt/ẩn đánh giá; theo dõi khách hàng và số liệu hoạt động.

## 11. API chính

Các endpoint cốt lõi:

```text
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/products
GET    /api/products/featured
GET    /api/products/:idOrSlug
GET    /api/categories
GET    /api/brands

GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/:id
DELETE /api/cart/items/:id

GET    /api/wishlist
POST   /api/wishlist/:productID
DELETE /api/wishlist/:productID

POST   /api/coupons/validate
POST   /api/orders/checkout
GET    /api/orders/mine
GET    /api/orders/:id
POST   /api/orders/:id/cancel
GET    /api/payments/order/:orderID
POST   /api/payments/order/:orderID/simulate-success

GET    /api/reviews/product/:productID
POST   /api/reviews
POST   /api/ai/chat
GET    /api/ai/recommendations
GET    /api/ai/history

GET    /api/inventory
POST   /api/inventory/:productID/adjust
GET    /api/inventory/:productID/history
GET    /api/dashboard
GET    /api/notifications
PUT    /api/notifications/:id/read

GET/POST/PUT/DELETE  /api/admin/...
```

Các route quản trị yêu cầu đúng vai trò. Response thường có dạng:

```json
{
  "success": true,
  "message": "Thành công",
  "data": {}
}
```

API danh sách sản phẩm có thêm thông tin phân trang.

## 12. AI DopTech

### Cách hoạt động

Backend nhận diện một số tiêu chí trong câu hỏi, ví dụ danh mục, khoảng giá, RAM, SSD, trọng lượng hoặc pin. Hệ thống truy vấn SQL Server để lấy sản phẩm đang hoạt động và còn tồn, sau đó lọc/xếp hạng và nêu căn cứ từ thông số có trong dữ liệu. Hội thoại kế thừa một số câu hỏi gần nhất trong phiên.

Gợi ý cá nhân hóa dựa trên tín hiệu hành vi như xem sản phẩm, thêm giỏ, yêu thích và mua hàng. Đây là cách chấm điểm theo luật trên nhóm danh mục/thương hiệu, không phải mô hình được huấn luyện từ dữ liệu lớn.

### Không có API key

Không cần `OPENAI_API_KEY` để dùng nhánh theo luật. Ví dụ câu hỏi:

```text
Laptop dưới 20 triệu, RAM 16GB để học IT.
Điện thoại dưới 10 triệu, pin tốt.
SSD 1TB nào phù hợp?
```

### Có API key

Khi cấu hình `OPENAI_API_KEY`, backend truy xuất sản phẩm trước rồi mới gửi phần ngữ cảnh đó cho mô hình để diễn đạt câu trả lời. Nếu lời gọi AI lỗi hoặc quá thời gian, hệ thống dùng câu trả lời dự phòng. Chất lượng lọc phụ thuộc độ đầy đủ và cách chuẩn hóa thông số trong dữ liệu sản phẩm.

## 13. Kịch bản demo đề xuất

### Admin

1. Đăng nhập Admin và xem Dashboard.
2. Tạo hoặc sửa sản phẩm, điền thông số kỹ thuật và ảnh.
3. Vào kho, nhập hàng và mở lịch sử biến động.

### Customer

1. Tìm laptop/điện thoại theo danh mục hoặc ngân sách.
2. Xem thông số, so sánh sản phẩm và hỏi AI một câu có tiêu chí cụ thể.
3. Thêm vào giỏ, áp voucher và xác nhận tổng tiền.
4. Đặt hàng bằng COD hoặc phương thức thanh toán mô phỏng.

### Đơn hàng xuyên suốt

1. Kiểm tra kho giảm sau checkout.
2. Nhân viên chuyển đơn lần lượt `CONFIRMED` → `PACKING` → `SHIPPING` → `COMPLETED`.
3. Với thanh toán trực tuyến mô phỏng, xác nhận thanh toán trước khi hoàn thành đơn.
4. Đánh giá sản phẩm sau khi đơn hoàn thành; Admin ẩn đánh giá và kiểm tra điểm trung bình được tính lại.
5. Tạo một đơn khác ở `PENDING`/`CONFIRMED`, hủy đơn rồi đối chiếu tồn kho và lịch sử trạng thái.

## 14. Bảo mật cơ bản

- Băm mật khẩu bằng bcrypt.
- JWT yêu cầu khóa riêng đủ độ dài; không còn khóa mặc định dùng chung.
- Middleware xác thực kiểm tra trạng thái, vai trò và phiên hiện hành.
- RBAC cho `ADMIN`, `STAFF`, `CUSTOMER` được áp dụng ở API backend.
- Truy vấn SQL dùng tham số; đầu vào quan trọng được kiểm tra.
- Khóa/tắt tài khoản, đổi vai trò và đăng xuất thu hồi phiên cũ.
- CORS cấu hình theo `FRONTEND_URL`; bí mật nằm trong `.env`, không đưa lên Git.
- Giới hạn tần suất đăng nhập, đăng ký và gọi AI cho cấu hình chạy một máy chủ.

Đây là dự án học thuật chạy localhost; cần rà soát thêm trước khi triển khai công khai. Thanh toán là **mô phỏng**, không giao dịch tiền thật.

## 15. Giao dịch quan trọng

- **Checkout:** khóa dữ liệu giỏ/tồn/voucher; tạo đơn, chi tiết, ghi nhận giảm kho, thanh toán và voucher trong giao dịch. Có khóa yêu cầu để hạn chế tạo đơn lặp.
- **Hủy đơn:** chỉ ở trạng thái cho phép; hoàn kho/voucher, cập nhật thanh toán và lưu lịch sử trong giao dịch.
- **Chuyển trạng thái/thanh toán:** khóa đơn và kiểm tra trạng thái hiện hành trước khi cập nhật, tránh thao tác trái trình tự hoặc ghi nhận trả tiền sau hủy.
- **Điều chỉnh kho:** kiểm tra quyền và không để tồn thấp hơn lượng đã giữ; ghi lại số lượng trước/sau.
- **Đánh giá:** chỉ cho phép đánh giá sản phẩm đã mua trong đơn hoàn thành; tính lại điểm trung bình khi kiểm duyệt.

Nếu một bước trong giao dịch thất bại, SQL rollback các cập nhật của giao dịch đó.

## 16. Khắc phục lỗi thường gặp

### Backend báo `JWT_SECRET` không hợp lệ

Tạo `backend/.env`, đặt `JWT_SECRET` ngẫu nhiên dài ít nhất 32 ký tự, lưu tệp rồi khởi động lại backend. Không dùng giá trị mẫu trong `.env.example`.

### `Failed to connect localhost` hoặc database disconnected

- Kiểm tra dịch vụ SQL Server đang chạy và đã bật TCP/IP.
- Kiểm tra đúng `DB_SERVER`, `DB_INSTANCE`, tài khoản và mật khẩu trong `.env`.
- Với instance `SQLEXPRESS`, thử `DB_SERVER=localhost` cùng `DB_INSTANCE=SQLEXPRESS` và kiểm tra SQL Server Browser.
- Mở `http://localhost:4001/api/health` để kiểm tra API và kết nối database.

### `Login failed for user`

Xác nhận tài khoản SQL được bật, chế độ xác thực tương thích và giá trị `DB_USER`/`DB_PASSWORD` chính xác. Không chia sẻ mật khẩu trong ảnh chụp hoặc log công khai.

### `Database does not exist`

Kiểm tra tên `DB_DATABASE`. Nếu là database demo hoàn toàn mới, có thể chạy `npm run db`. Lệnh này reset schema demo; tuyệt đối không chạy trên database đang cần giữ dữ liệu. Với database hiện hữu, dùng migration, không dùng lệnh reset.

### `Port already in use`

Backend mặc định dùng cổng `4001`, frontend dùng `5173`. Đóng tiến trình đang chiếm cổng hoặc đổi `PORT`/cấu hình frontend tương ứng.

### CORS hoặc frontend không gọi được API

Kiểm tra `FRONTEND_URL=http://localhost:5173`, mở đúng địa chỉ frontend và xác nhận API đang lắng nghe tại cổng backend cấu hình.

### `Invalid token` hoặc bị đưa về trang đăng nhập

Đăng nhập lại. Phiên cũ bị thu hồi sau đăng xuất, khóa tài khoản, đổi vai trò hoặc thay JWT secret.

## 17. Ghi chú cho đồ án

### Bài toán và giá trị

DopTech kết nối dữ liệu sản phẩm, nghiệp vụ đơn hàng và tồn kho, quyền người dùng cùng tư vấn sản phẩm. Giá trị chính của đồ án là thiết kế được luồng nghiệp vụ và cách duy trì tính nhất quán dữ liệu; AI là phần hỗ trợ tìm/chọn sản phẩm.

### Phương pháp đánh giá nên trình bày

- Kiểm tra các kịch bản đặt/hủy đơn, thanh toán, voucher và tồn kho.
- Kiểm tra quyền từng vai trò và truy cập chéo đơn hàng.
- Chuẩn bị tập câu hỏi có đáp án mong đợi để đo AI nhận diện đúng danh mục, ngân sách và cấu hình.
- Nếu có người tham gia, yêu cầu họ thực hiện tác vụ mẫu và thu thập nhận xét về độ dễ dùng.

Không ghi tỷ lệ chính xác hoặc mức hài lòng như kết quả thực tế nếu chưa đo. Các kiểm thử đã có gồm 8 kiểm thử quy tắc và 13 kịch bản tích hợp API/SQL; đó là bằng chứng kiểm thử chức năng, chưa thay cho khảo sát người dùng, kiểm thử tải hoặc đánh giá AI trên bộ dữ liệu lớn.

### Giới hạn và hướng phát triển

- Tích hợp cổng thanh toán và đơn vị vận chuyển thật.
- Chuẩn hóa thông số sản phẩm rộng hơn và bổ sung bộ đánh giá AI có thể lặp lại.
- Hoàn thiện lưu nhiều phiên hội thoại và nghiên cứu mô hình gợi ý sâu hơn nếu có dữ liệu phù hợp.
- Kiểm thử giao diện trình duyệt, tải và bảo mật trước khi triển khai công khai.
- Bổ sung audit log và hạ tầng rate limit dùng chung nếu chạy nhiều máy chủ.

Kết luận phù hợp: DopTech là **nguyên mẫu học thuật của hệ thống thương mại điện tử có tư vấn sản phẩm**, chưa phải nền tảng thanh toán/vận hành sản xuất hoàn chỉnh.
