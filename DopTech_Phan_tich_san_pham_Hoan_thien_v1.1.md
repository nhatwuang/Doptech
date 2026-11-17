# BƯỚC 1 — PHÂN TÍCH SẢN PHẨM DOPTECH

**ĐỒ ÁN TỐT NGHIỆP NGÀNH HỆ THỐNG THÔNG TIN**  
**Phiên bản:** 1.1 — bản phân tích hoàn thiện để chuyển sang đặc tả  
**Ngày cập nhật:** 15/10/2026  
**Trạng thái:** Tài liệu cơ sở; các quyết định đánh dấu *cần xác nhận* chưa phải yêu cầu được phê duyệt.

> **Nguồn và giới hạn xác minh.** Tài liệu này được biên tập từ bản “Bước 1 — Phân tích sản phẩm DopTech” v1.0 do người thực hiện cung cấp. Bản v1.0 cho biết có tham chiếu README và `REVIEW-MA-NGUON.md`, nhưng hai tệp đó chưa được cung cấp để đối chiếu trong lần hoàn thiện này. Do vậy, các mô tả “hiện có/đã kiểm thử” chỉ được giữ ở mức *theo báo cáo v1.0*, không được diễn giải thành kết luận độc lập về mã nguồn. Các thay đổi của v1.1 được ghi là **quyết định thiết kế đề xuất** hoặc **đầu việc cần kiểm chứng**, không mặc định hệ thống đã triển khai.

## TÓM TẮT ĐIỀU HÀNH

DopTech là hệ thống thông tin hỗ trợ hoạt động bán lẻ thiết bị công nghệ cho **một cửa hàng, một kho logic**, gồm website khách hàng và các giao diện vận hành dành cho nhân viên, quản trị viên. Bài toán trọng tâm là đảm bảo nhất quán dữ liệu xuyên suốt **danh mục → giỏ hàng → đặt hàng → thanh toán → tồn kho → hoàn thành/hủy → báo cáo**. Tư vấn AI hỗ trợ tìm và giải thích lựa chọn từ **sản phẩm có thật trong hệ thống**, không quyết định thay người dùng và không tự thay đổi dữ liệu giao dịch.

Phạm vi tốt nghiệp tập trung vào nghiệp vụ bán hàng an toàn, tính đúng đắn và kiểm thử có thể lặp lại; không xây dựng sàn đa người bán, hệ thống thanh toán thật hoặc mô hình AI tự huấn luyện. Các nội dung P0 phải được chốt trước khi hoàn thành đặc tả: chính sách thanh toán trước khi đóng gói, ý nghĩa tồn kho, chống đặt đơn trùng, đường đi hủy đơn và kiểm soát quyền tại API.

## 1. ĐỊNH VỊ SẢN PHẨM VÀ ĐỀ TÀI

### 1.1. DopTech là sản phẩm gì?

DopTech là hệ thống thông tin hỗ trợ bán lẻ thiết bị công nghệ trực tuyến và vận hành cửa hàng: quản lý sản phẩm theo danh mục, thương hiệu, SKU và thông số; cho phép khách tìm kiếm, lọc, so sánh, tư vấn, đặt hàng và theo dõi đơn; hỗ trợ nhân viên xử lý đơn và nhập kho; cung cấp cho quản trị viên công cụ kiểm soát người dùng, hàng hóa, thanh toán mô phỏng và báo cáo.

**Tính chất hệ thống:** một nguồn dữ liệu nghiệp vụ nhất quán trong SQL Server; các thao tác thay đổi đơn và kho cần giao dịch, kiểm tra quyền và khả năng truy vết. AI là phân hệ **hỗ trợ quyết định mua**; kết quả AI không thay thế bước xác nhận giá, tồn và thanh toán của Backend.

### 1.2. Tên đề tài

**Tên đã sử dụng trong hồ sơ đề tài:** “Xây dựng website thương mại điện tử DopTech – nền tảng mua sắm thiết bị công nghệ trực tuyến”.

**Cách diễn đạt nhấn mạnh góc độ Hệ thống thông tin (chỉ đề xuất, không tự ý đổi hồ sơ):** “Phân tích, thiết kế và xây dựng hệ thống thông tin hỗ trợ bán lẻ thiết bị công nghệ DopTech tích hợp tư vấn và gợi ý sản phẩm”.

**Tên sản phẩm hiển thị:** DopTech — *Technology for Everyone*.

Tên chính thức cần khớp với đề cương/đăng ký đã được duyệt. Bản phân tích không làm thay đổi tên đề tài nếu chưa có chấp thuận.

### 1.3. Mô hình kinh doanh và giả định nền

- Một chủ thể cửa hàng sở hữu và bán các sản phẩm trong danh mục; không có người bán bên thứ ba.
- Một kho logic dùng chung; chưa quản lý tồn theo chi nhánh, vị trí kệ hoặc lô/serial.
- Sản phẩm bán có giá niêm yết, giá khuyến mãi và voucher theo quy tắc; đơn giá phải được chốt và lưu tại thời điểm đặt.
- **Một SKU là một cấu hình/biến thể cần theo dõi tồn riêng.** Sản phẩm khác RAM, dung lượng hoặc màu nếu tồn độc lập sẽ có SKU khác.
- Đơn được giao nhận thông qua quy trình mô phỏng trạng thái; chưa tích hợp đơn vị vận chuyển thật.
- COD và ít nhất một phương thức thanh toán trực tuyến mô phỏng; không thu hoặc hoàn tiền thật.
- Dữ liệu tài khoản, sản phẩm và giao dịch mẫu là dữ liệu kiểm thử/seed; không suy rộng thành dữ liệu doanh nghiệp đã khảo sát.

### 1.4. Phương pháp và căn cứ

Phân tích được thực hiện theo cách **phân tích nguyên mẫu hiện có** và phát biểu giả định nghiệp vụ. Cần bổ sung hoạt động kiểm chứng: đối chiếu README/mã nguồn, phỏng vấn người hướng dẫn hoặc đại diện cửa hàng giả định, và kiểm thử các đường đi quan trọng. Các tiêu chí định lượng trong tài liệu là **mục tiêu dự kiến**, chưa phải kết quả đo.

## 2. BÀI TOÁN CẦN GIẢI QUYẾT

### 2.1. Góc nhìn người mua

Thiết bị công nghệ có thông số đa chiều (CPU, GPU, RAM, SSD, màn hình, pin, trọng lượng), khiến khách khó thu hẹp lựa chọn theo mục đích sử dụng và ngân sách. Thông tin trên từng trang cần đồng nhất với giá đặt hàng; khách cần biết rõ trạng thái còn bán/còn hàng, tổng thanh toán, tình trạng đơn và điều kiện đánh giá sản phẩm. Khó khăn nêu ở đây là **giả thuyết nghiên cứu**, cần xác nhận bằng khảo sát tác vụ hoặc phản hồi người dùng.

### 2.2. Góc nhìn cửa hàng

Cửa hàng cần xử lý đồng bộ dữ liệu sản phẩm, đơn, tồn, lượt voucher và thanh toán. Những lỗi cần ngăn ngừa gồm bán vượt tồn, đơn tạo hai lần do người dùng gửi lại, hoàn kho hai lần do hủy lặp, trạng thái đơn vượt bước, thiếu lịch sử thay đổi, nhân viên vượt quyền và báo cáo khác số liệu gốc.

### 2.3. Phát biểu bài toán

Xây dựng hệ thống cho phép khách tìm, so sánh, được tư vấn và đặt mua thiết bị công nghệ; giúp cửa hàng xử lý từ tiếp nhận đến hoàn thành hoặc hủy đơn trên cùng cơ sở dữ liệu. Hệ thống phải bảo đảm phân quyền, kiểm soát giá/tồn từ Backend, cập nhật nguyên tử và có lịch sử đối chiếu. Phân hệ tư vấn chỉ được dựa vào danh mục được phép bán, không được tự bịa sản phẩm hoặc nới lỏng tiêu chí bắt buộc mà không báo người dùng.

## 3. MỤC TIÊU, GIÁ TRỊ VÀ RANH GIỚI ĐÁNH GIÁ

| Mã | Mục tiêu | Giá trị mong đợi | Minh chứng nghiệm thu dự kiến |
|---|---|---|---|
| OBJ-01 | Đồng nhất thông tin sản phẩm | Tra cứu và đặt hàng nhất quán | Đối chiếu danh sách, chi tiết, giỏ và snapshot đơn |
| OBJ-02 | Chuẩn hóa vòng đời đơn | Không bỏ bước/chuyển lùi tùy ý | Bảng chuyển trạng thái và API tests |
| OBJ-03 | Bảo vệ tồn kho | Không bán vượt tồn hoặc hoàn kho lặp | Kiểm thử tranh chấp, rollback, hủy đồng thời |
| OBJ-04 | Kiểm soát quyền | Không truy cập trái phép tài nguyên cá nhân | Ma trận quyền và kiểm thử 401/403/404 |
| OBJ-05 | Hỗ trợ lựa chọn phù hợp | Tư vấn dựa trên dữ liệu có thật | Bộ câu hỏi chuẩn hóa và đối soát kết quả |
| OBJ-06 | Hỗ trợ quản trị | Có chỉ số rõ công thức, đối soát được | Bộ dữ liệu chuẩn, báo cáo và phép tính độc lập |
| OBJ-07 | Có thể cài đặt, kiểm thử lại | Giảm rủi ro khi demo và bảo trì | README, seed, môi trường thử, nhật ký chạy |

**Đóng góp học thuật dự kiến:** (1) mô hình hóa nghiệp vụ; (2) thiết kế dữ liệu, bất biến và giao dịch; (3) phần mềm minh chứng; (4) phép thử có bằng chứng. **Không tuyên bố** tăng doanh thu, tỷ lệ chính xác AI hay mức đáp ứng hiệu năng trước khi thực đo.

## 4. NGƯỜI DÙNG, BÊN LIÊN QUAN VÀ PHÂN QUYỀN

### 4.1. Tác nhân

| Vai trò | Nhiệm vụ chính | Giới hạn |
|---|---|---|
| Khách vãng lai | Xem, tìm, lọc, so sánh, hỏi tư vấn | Phải đăng nhập để lưu giỏ và đặt hàng theo thiết kế hiện tại |
| Customer | Đặt và theo dõi đơn; quản lý tài khoản, địa chỉ; đánh giá | Chỉ được truy cập đơn và tài nguyên của mình |
| Staff | Xem, xử lý tuần tự đơn; nhập tăng kho; tác vụ phục vụ khách được cấp | Không đổi vai trò, không xem báo cáo doanh thu; không điều chỉnh giảm tồn |
| Admin | Quản lý dữ liệu bán hàng, quyền, kho, đơn, báo cáo | Mọi thao tác nhạy cảm vẫn phải ghi nhận và kiểm tra bất biến |
| Chủ cửa hàng giả định | Theo dõi hiệu quả kinh doanh | Đại diện bởi tài khoản Admin, không tạo vai trò riêng ở v1.1 |
| Giảng viên/hội đồng | Đánh giá sản phẩm và tài liệu | Không phải vai trò đăng nhập |

### 4.2. Ma trận quyền nghiệp vụ (đề xuất để đối chiếu API)

Ký hiệu: **X** xem; **T** thực hiện/thay đổi; **C** chỉ tài nguyên của chính mình; **–** không cho phép. Không suy luận an toàn chỉ từ việc ẩn nút trên giao diện.

| Chức năng | Vãng lai | Customer | Staff | Admin |
|---|---|---|---|---|
| Xem sản phẩm hoạt động, tìm kiếm, so sánh | X | X | X | X |
| Tư vấn trên danh mục công khai | X | X | X | X |
| Giỏ, địa chỉ, checkout | – | C | – | – |
| Xem và yêu cầu hủy đơn cá nhân | – | C | – | – |
| Xem danh sách đơn toàn hệ thống | – | – | X | X |
| Chuyển trạng thái xử lý đơn tuần tự | – | – | T | T |
| Hủy đơn vận hành qua quy trình chuyên dụng | – | – | – | T |
| Xác nhận thanh toán trực tuyến mô phỏng | – | C | – | T |
| Nhập tăng kho | – | – | T | T |
| Điều chỉnh giảm/tăng kho đặc biệt | – | – | – | T |
| Quản trị danh mục/sản phẩm/giá | – | – | Giới hạn theo quyết định | T |
| Quản trị vai trò và tài khoản | – | – | – | T |
| Kiểm duyệt đánh giá | – | – | Nếu được cấp | T |
| Xem báo cáo doanh thu | – | – | – | X |

**Điểm cần xác nhận:** quyền Staff sửa thông tin sản phẩm và kiểm duyệt đánh giá chưa được chốt từ bản phân tích; trước khi đặc tả SRS phải xác định rõ CRUD và kiểm tra tương ứng với chính sách Backend thực tế. Không mặc định Staff được cấp quyền chỉ vì giao diện có menu.

## 5. PHẠM VI PHIÊN BẢN TỐT NGHIỆP

### 5.1. Hạng mục bắt buộc (MUST)

1. Đăng ký/đăng nhập/đăng xuất, xác thực phiên, phân quyền tại API.
2. Danh mục, thương hiệu, sản phẩm, SKU, ảnh, thông số, giá và trạng thái bán.
3. Danh sách sản phẩm, tìm/lọc/sắp xếp/phân trang, chi tiết, so sánh tối đa ba sản phẩm.
4. Giỏ hàng, địa chỉ nhận hàng, phí giao hàng và voucher.
5. Checkout, chống lặp tạo đơn, quản lý vòng đời đơn và hủy hợp lệ.
6. COD và ít nhất một thanh toán trực tuyến **mô phỏng**, công khai đặc tính mô phỏng.
7. Theo dõi tồn kho, nhập/điều chỉnh theo quyền, lịch sử biến động.
8. Đánh giá sau khi đơn hoàn thành và kiểm duyệt đánh giá.
9. Báo cáo đơn hoàn thành/doanh thu quy ước, bán chạy, tồn thấp.
10. Tư vấn theo danh mục, ngân sách và thông số chuẩn hóa; có fallback khi dịch vụ AI ngoài hệ thống gặp lỗi.
11. Kiểm thử nghiệp vụ, quyền, cạnh tranh dữ liệu, lỗi mạng và phục hồi.

### 5.2. Sau khi lõi ổn định (SHOULD)

Yêu thích, thông báo, gợi ý hành vi; quản lý đầy đủ sửa/xóa/chọn địa chỉ mặc định; lịch sử nhiều phiên chat; cải thiện accessibility/responsive; xem log nghiệp vụ thuận tiện. Các phần nếu đã có bản chạy cũng phải được kiểm tra lại sau sửa lõi.

### 5.3. Ngoài phạm vi (WON'T, phiên bản này)

Giao dịch ngân hàng thật, giao nhận vận chuyển thật, nhiều kho/chi nhánh, đa người bán, công nợ/kế toán/hóa đơn điện tử, hệ thống bảo hành/đổi trả sau giao đầy đủ, quản lý serial/IMEI, huấn luyện mô hình AI riêng, ứng dụng di động độc lập. Chức năng mới vượt phạm vi cần trình bày ở chương Hướng phát triển, không hứa như đã thực hiện.

## 6. QUY TRÌNH NGHIỆP VỤ VÀ NGOẠI LỆ

### 6.1. Tìm, so sánh và chọn sản phẩm

**Tác nhân:** khách vãng lai/Customer. **Tiền điều kiện:** hệ thống danh mục hoạt động.

1. Khách tìm theo từ khóa, danh mục, thương hiệu, giá, thông số hoặc nhập yêu cầu tư vấn.
2. Backend trả các sản phẩm được phép bán, giá hiện hành và khả dụng theo thời điểm truy vấn.
3. Khách đọc thông số, đánh giá, so sánh tối đa ba sản phẩm.
4. Nếu muốn mua, khách đăng nhập và thêm vào giỏ; hệ thống kiểm tra số lượng nhập hợp lệ.

**Ngoại lệ:** không tìm thấy, tiêu chí mâu thuẫn, thuộc tính không đủ dữ liệu, sản phẩm bị tắt hoặc thiếu tồn; UI giải thích tình huống thay vì trả một danh sách trống như thành công. Không tự nới lỏng tiêu chí bắt buộc.

### 6.2. Đặt hàng và chống lặp

**Tiền điều kiện:** Customer đã xác thực; giỏ có hàng; địa chỉ nhận hợp lệ.

1. Khách kiểm tra giỏ, địa chỉ, hình thức giao, thanh toán và voucher.
2. Backend lấy lại giá, tồn, trạng thái sản phẩm/danh mục/thương hiệu, voucher và tính tổng tiền; không tin số tiền từ frontend.
3. Nếu thông tin giá hoặc tổng tiền đã thay đổi so với màn xác nhận, báo khách để xác nhận lại trước khi tạo đơn.
4. Frontend gửi yêu cầu checkout với **Idempotency-Key** duy nhất cho một lần xác nhận đặt hàng.
5. Backend kiểm tra quyền sở hữu giỏ, dữ liệu hợp lệ, khả dụng và khóa các bản ghi cần thiết.
6. Trong **một giao dịch SQL**: tạo đơn và snapshot chi tiết; giảm tồn khả dụng; ghi lịch sử biến động; tạo thanh toán mô phỏng; ghi nhận voucher; xóa mục giỏ đã đặt; ghi lịch sử đơn và thông báo phù hợp.
7. Commit thành công mới trả mã đơn. Nếu lỗi, rollback; frontend hiển thị trạng thái chưa xác định khi mất phản hồi và cho kiểm tra lại kết quả.
8. Nếu cùng khách gửi lại cùng khóa với cùng payload đã xử lý thành công, trả kết quả trước đó; không tạo đơn thứ hai. Cùng khóa nhưng payload khác phải trả lỗi xung đột.

**Quyết định thiết kế đề xuất:** có bảng/khóa lưu `(UserID, Operation, IdempotencyKey)` duy nhất, fingerprint payload, trạng thái xử lý và tham chiếu đơn đã tạo. Chống lặp phải hoạt động khi gửi đồng thời, không chỉ khi gửi tuần tự. Cách lưu chính xác cần đặc tả tại bước thiết kế.

**Ngoại lệ cần kiểm thử:** hết tồn ở sản phẩm cuối; voucher hết lượt; thay giá sau khi vào giỏ; hai khách checkout đồng thời; lỗi giữa các lệnh SQL; gửi lại sau timeout; nhấn Đặt hàng hai lần liên tiếp.

### 6.3. Trạng thái đơn hàng và thanh toán

**Luồng chuẩn:** `PENDING → CONFIRMED → PACKING → SHIPPING → COMPLETED`.

**Hai chuyển sang hủy hợp lệ:** `PENDING → CANCELLED` hoặc `CONFIRMED → CANCELLED` (qua nghiệp vụ hủy chuyên dụng, không cập nhật trực tiếp trường trạng thái).

| Trạng thái | Ý nghĩa | Chuyển tiếp được phép |
|---|---|---|
| PENDING | Đã ghi nhận, chờ tiếp nhận | CONFIRMED hoặc CANCELLED |
| CONFIRMED | Đã xác nhận tiếp nhận | PACKING hoặc CANCELLED |
| PACKING | Đang chuẩn bị hàng | SHIPPING |
| SHIPPING | Đang giao hàng | COMPLETED |
| COMPLETED | Hoàn thành | Không |
| CANCELLED | Đã hủy và xử lý hoàn kho | Không |

**Quy tắc liên quan đến thanh toán:** COD được ghi nhận đã thanh toán khi đơn chuyển COMPLETED theo quy ước demo. Với các phương thức **trả trước mô phỏng**, **đề xuất chốt** `PaymentStatus=PAID` trước khi chuyển sang PACKING; chưa đủ điều kiện thì không được đóng gói/giao/hoàn thành. Cần đối chiếu chính sách này với mã nguồn, vì bản v1.0 chỉ xác nhận hệ thống đang chặn khi hoàn thành.

Trạng thái thanh toán độc lập trạng thái giao hàng. Không diễn giải giao diện “thanh toán thành công” mô phỏng thành giao dịch ngân hàng thật. Khách sở hữu đơn hoặc Admin mới được thực hiện thao tác xác nhận thanh toán mô phỏng; Staff không được phép.

### 6.4. Hủy đơn và hoàn tồn

1. Customer sở hữu đơn hoặc Admin yêu cầu hủy qua **Cancel Order Service**.
2. Backend khóa đơn và xác nhận trạng thái hiện tại chỉ PENDING/CONFIRMED; kiểm tra quyền.
3. Trong giao dịch: cập nhật CANCELLED; hoàn tồn một lần; ghi `CANCEL_RESTORE`; hoàn lượt voucher đúng chính sách; cập nhật trạng thái thanh toán mô phỏng; ghi log và thông báo.
4. Yêu cầu hủy lặp không phát sinh lần hoàn kho thứ hai. Hủy đồng thời với CONFIRM/PACKING phải cho ra kết quả xác định đúng quy tắc chuyển trạng thái.

**Quy ước mô phỏng hiện có theo v1.0:** đơn đã trả chuyển thanh toán sang `REFUNDED`, đơn chưa trả chuyển `FAILED` khi hủy. Đây chỉ là trạng thái trong CSDL; không có tiền hoàn thực tế. Trong phiên bản tiếp theo có thể dùng `CANCELLED`/`VOIDED` cho thanh toán chưa thực hiện nếu thiết kế lại bảng trạng thái.

### 6.5. Quy tắc tồn kho thống nhất

Bản v1.0 nêu công thức `khả dụng = tồn lưu − số lượng đã giữ`, nhưng đồng thời chưa có quy trình giữ kho riêng. Để không mâu thuẫn với cách xử lý hiện tại, **v1.1 đề xuất dùng một trường `AvailableQuantity` phản ánh số lượng còn có thể bán** trong mô hình một kho logic. Hệ thống không triển khai `ReservedQuantity` riêng trong phạm vi này.

- Thêm vào giỏ **không giữ hàng**; checkout phải kiểm tra lại.
- Checkout giảm `AvailableQuantity` đúng một lần; không trừ lại khi PACKING, SHIPPING, COMPLETED.
- Hủy hợp lệ hoàn đúng một lần.
- Nhập kho tăng; điều chỉnh phải có quyền, lý do và lịch sử trước/sau.
- Không cho số lượng âm; cập nhật đồng thời phải được khóa/kiểm soát trong giao dịch.
- Nếu về sau cần quản lý hàng vật lý, đã giữ và đang giao, phải thiết kế lại mô hình kho, không đổi ngầm ý nghĩa cột hiện tại.

### 6.6. AI tư vấn dựa trên dữ liệu

1. Tiếp nhận yêu cầu và ngữ cảnh hội thoại giới hạn.
2. Nhận diện danh mục, ngân sách, khoảng giá, thuộc tính bắt buộc và tùy chọn.
3. Chuẩn hóa giá/đơn vị (nghìn, triệu, tỷ) và thông số như RAM_GB, Storage_GB; không suy đoán giá trị thiếu.
4. Truy vấn sản phẩm đang bán và đủ khả dụng từ SQL Server; lọc **điều kiện bắt buộc trước**, xếp hạng theo độ phù hợp sau.
5. Trả sản phẩm thực có với giá hiện hành, đặc điểm và lý do; nếu không có kết quả thì thông báo rõ và xin phép nới tiêu chí.
6. Nếu sử dụng LLM, chỉ dùng dữ liệu đã truy xuất làm căn cứ diễn đạt; khi quá thời gian hoặc có lỗi, fallback sang tư vấn theo luật.

AI không được cập nhật giá, tồn, voucher, đơn hoặc thanh toán. Không được khẳng định “92% phù hợp” nếu chưa định nghĩa công thức điểm và kiểm chứng. Với thuộc tính không có dữ liệu, kết quả phải ghi “chưa đủ thông tin để xác nhận”.

### 6.7. Đánh giá, kiểm duyệt và báo cáo

Customer chỉ được đánh giá sản phẩm thực sự nằm trong đơn COMPLETED của mình và đáp ứng giới hạn số lần đánh giá đã đặc tả. Khi đánh giá chuyển trạng thái công khai/ẩn, chỉ đánh giá công khai được tính vào điểm trung bình hiển thị.

**Quy ước KPI đề xuất:**

- `GrossMerchandiseValue` (giá trị hàng trước khuyến mãi): tổng đơn giá snapshot × số lượng của dòng hàng phù hợp tiêu chí thời gian/trạng thái.
- `CompletedOrderAmount` (giá trị thanh toán của đơn hoàn thành): tổng của đơn `COMPLETED` sau giảm và cộng phí vận chuyển theo quy ước v1.0; là chỉ số báo cáo nội bộ, **không đồng nghĩa lợi nhuận** hoặc doanh thu kế toán đã đối soát.
- `CompletedUnits`: số lượng sản phẩm thuộc đơn COMPLETED, dùng cho báo cáo bán chạy.
- `OrderedUnits`: số lượng sản phẩm đã được tạo đơn, nếu cần theo dõi nhu cầu đặt.

Nếu báo cáo theo danh mục sử dụng giá trị dòng hàng trước voucher/phí giao, phải đặt nhãn riêng và mô tả quy tắc phân bổ giảm giá nếu muốn đối chiếu về tổng. Trường `SoldCount` hiện được cho là tăng lúc checkout theo bản v1.0; phải chốt lại ý nghĩa hoặc cách tính trước nghiệm thu.

## 7. YÊU CẦU CHỨC NĂNG VÀ NGHIỆM THU

| Mã | Yêu cầu | Tiêu chí chấp nhận chính |
|---|---|---|
| FR-01 | Xác thực, phân quyền, thu hồi phiên | Từ chối token sai/hết hạn; truy cập API theo vai trò và sở hữu |
| FR-02 | Quản lý dữ liệu sản phẩm | SKU duy nhất; giá/thông số/ảnh hợp lệ; sản phẩm/danh mục/thương hiệu đồng trạng thái |
| FR-03 | Tra cứu/so sánh | Lọc và phân trang chính xác; không quá 3 sản phẩm so sánh |
| FR-04 | Giỏ hàng | Số lượng nguyên dương; thuộc khách; checkout kiểm tra lại tồn |
| FR-05 | Checkout | Tổng do server tính; giao dịch nguyên tử; cùng Idempotency-Key không tạo đơn lặp |
| FR-06 | Voucher | Kiểm tra thời hạn, điều kiện, lượt, giới hạn giảm và tranh chấp lượt cuối |
| FR-07 | Vòng đời đơn | Chuyển đúng bước; có lịch sử thao tác; không truy cập đơn người khác |
| FR-08 | Hủy và thanh toán | Chỉ hủy trước PACKING; hoàn kho tối đa một lần; chặn thanh toán sau hủy |
| FR-09 | Tồn kho | Không âm; trừ/hoàn chính xác; lưu trước/sau/nguyên nhân/người thực hiện |
| FR-10 | Địa chỉ | Tối đa một mặc định/khách; lỗi không làm mất mặc định đã có |
| FR-11 | Đánh giá | Đúng khách và đơn đủ điều kiện; trạng thái công khai ảnh hưởng điểm bình quân |
| FR-12 | Tư vấn | Không vi phạm tiêu chí bắt buộc; không bịa sản phẩm; fallback hoạt động |
| FR-13 | Báo cáo | Công thức rõ; kết quả khớp bộ dữ liệu đối soát |
| FR-14 | Vận hành và phục hồi | Health rõ trạng thái, có hướng dẫn cài đặt, backup và khôi phục thử |

Các tiêu chí trên được **đề xuất cho đặc tả**, không được đánh dấu đã đạt trước khi chạy kiểm thử tương ứng.

## 8. QUY TẮC NGHIỆP VỤ VÀ BẤT BIẾN DỮ LIỆU

| Mã | Quy tắc bắt buộc |
|---|---|
| BR-01 | Người dùng chỉ thao tác tài nguyên của mình, trừ quyền vận hành được cấp tại API |
| BR-02 | Sản phẩm chỉ bán được khi sản phẩm, danh mục và thương hiệu đều hoạt động |
| BR-03 | Tồn khả dụng đủ khi checkout; cập nhật không được tạo giá trị âm |
| BR-04 | Giá, giảm giá, phí giao và tổng phải do Backend tính |
| BR-05 | Tạm tính = tổng `UnitPriceSnapshot × Quantity`; tổng = tạm tính − giảm giá + phí giao |
| BR-06 | Giảm không âm, không vượt tạm tính; voucher được kiểm tra trong giao dịch |
| BR-07 | Một xác nhận checkout với cùng khóa chống lặp chỉ có tối đa một đơn thành công |
| BR-08 | Hủy chỉ từ PENDING/CONFIRMED; mỗi đơn chỉ phát sinh hoàn tồn một lần |
| BR-09 | Thanh toán trước phải PAID trước PACKING (đề xuất chờ xác nhận); COD thanh toán lúc COMPLETED |
| BR-10 | Đơn lưu snapshot tên sản phẩm, SKU, đơn giá và thông tin người nhận/địa chỉ |
| BR-11 | Thay đổi hồ sơ, địa chỉ, giá hiện tại không sửa ngược dữ liệu đã chốt trong đơn |
| BR-12 | AI phải lọc tiêu chí bắt buộc, không tự nới điều kiện hoặc dùng sản phẩm không có thật |
| BR-13 | Một khách có tối đa một địa chỉ mặc định, kể cả khi thao tác đồng thời |
| BR-14 | Kiểm duyệt đánh giá phải nhất quán với điểm trung bình công khai |
| BR-15 | Mọi thay đổi tồn có dấu vết loại nghiệp vụ, tham chiếu, số lượng trước/sau, thời điểm, người/thành phần thực hiện |
| BR-16 | Thanh toán của đơn đã hủy không được chuyển thành PAID bằng API mô phỏng |

**Quy ước voucher cần chốt:** để tránh nhập nhằng `0` và “không giới hạn”, v1.1 đề xuất dùng **NULL = không giới hạn; 0 = không được dùng** cho trường giới hạn lượt, và kiểm tra cả khi áp dụng lẫn checkout. Nếu schema hiện tại đang dùng quy ước khác, cần xác định và migrate trước khi áp dụng.

## 9. YÊU CẦU PHI CHỨC NĂNG VÀ KIẾN TRÚC TRIỂN KHAI

### 9.1. Yêu cầu phi chức năng

| Mã | Nhóm | Mục tiêu dự kiến | Kiểm chứng |
|---|---|---|---|
| NFR-01 | Bảo mật | Mật khẩu băm; token hợp lệ; kiểm tra quyền ở API; chống SQL injection | API security tests, review cấu hình, truy cập chéo |
| NFR-02 | Nhất quán | Lỗi giữa giao dịch không để lại cập nhật một phần | Fault injection và đối chiếu trước/sau |
| NFR-03 | Hiệu năng | API tra cứu thông thường có p95 < 2 giây ở 20 người dùng đồng thời trong môi trường thử đã công bố | k6/JMeter; đo p50/p95/tỷ lệ lỗi; chưa áp cho LLM |
| NFR-04 | Khả dụng | Lỗi SQL/AI phải phân biệt rõ; AI ngoài lỗi có fallback | Giả lập mất mạng, timeout, DB disconnect |
| NFR-05 | Dễ sử dụng | Tổng tiền, trạng thái, lỗi, biểu mẫu rõ ràng; responsive | Kịch bản người dùng và kiểm tra mobile |
| NFR-06 | Bảo trì | Phân tầng modules; cấu hình ngoài source; cài lại được | Code review, chạy từ README sạch |
| NFR-07 | Truy vết | Đối chiếu được đơn, thay đổi trạng thái và kho | Kiểm tra actor, timestamp, reference |
| NFR-08 | Phục hồi | Có backup và thử restore SQL Server ở môi trường thử | Log sao lưu, restore và chạy health/query |

### 9.2. Kiến trúc logic đề xuất

**Modular Monolith:** ReactJS/Vite frontend → REST API Node.js/Express → các module Auth, Catalog, Orders, Payments, Inventory, Reporting, AI → SQL Server. Các lời gọi nhà cung cấp LLM (nếu cấu hình) chỉ đi từ Backend; khóa API không lưu trong frontend.

Các tầng nên có trách nhiệm:

- **Routes/Controllers:** tiếp nhận HTTP, validation cơ bản và ánh xạ phản hồi.
- **Services:** áp dụng quy tắc nghiệp vụ, trạng thái, phân quyền đối tượng và giao dịch.
- **Repositories/Data Access:** truy vấn SQL tham số hóa, quản lý pool/transaction.
- **Middleware:** xác thực, RBAC, error handling, request ID và ghi log an toàn.
- **AI Adapter:** phân tích ý định/lọc sản phẩm/diễn đạt; có fallback theo luật.

Không cần tách microservices trong phạm vi đồ án vì sẽ tăng chi phí triển khai và đồng bộ giao dịch mà không cải thiện trực tiếp bài toán học thuật.

### 9.3. Kiến trúc chạy và giám sát

Môi trường phát triển ví dụ: `http://localhost:5174` (React Vite), `http://localhost:4001` (Express API), SQL Server `localhost\\SQLEXPRESS` với database `DopTechDB`, và nhà cung cấp AI tùy cấu hình. Đây là **cấu hình minh họa**, không phải yêu cầu cổng cố định hoặc chứng nhận đã kết nối.

Phân biệt:

- **Liveness:** Node/Express có phản hồi.
- **Readiness:** các phụ thuộc bắt buộc như SQL Server đủ sẵn sàng để phục vụ nghiệp vụ.
- **Database health:** truy vấn kiểm tra kết nối thành công.
- **AI health:** AI provider hoạt động hoặc fallback đang sẵn có; không được che lỗi dưới trạng thái “đã kết nối”.

Thông tin health công khai không tiết lộ mật khẩu, chuỗi kết nối hoặc bí mật cấu hình. Server ghi log có mức độ, thời gian, mã yêu cầu và nguyên nhân đã lược bỏ dữ liệu nhạy cảm.

### 9.4. Môi trường đo hiệu năng

Báo cáo phải ghi CPU, RAM, hệ điều hành, phiên bản Node/SQL Server, cấu hình kết nối, số lượng sản phẩm/đơn seed, đường đi API, thời lượng tải, số người dùng ảo và tỷ lệ lỗi. Không lấy việc trình duyệt mở được trang chủ làm bằng chứng cho p95 API. Lời gọi AI/LLM được đo riêng vì có thời gian phản hồi và timeout khác.

## 10. NHÓM DỮ LIỆU, THIẾT KẾ VÀ TỪ ĐIỂN BAN ĐẦU

### 10.1. Các thực thể và quan hệ chính

| Nhóm | Thực thể dự kiến | Quan hệ/ràng buộc trọng tâm |
|---|---|---|
| Danh tính | Roles, Users, Customers, Staff, Addresses | Quyền; người dùng có nhiều địa chỉ, tối đa một mặc định |
| Danh mục | Categories, Brands, Products, ProductImages, ProductSpecifications | Product gắn Category/Brand; SKU duy nhất; thông số có đơn vị |
| Mua sắm | Carts, CartItems, Wishlists | Giỏ thuộc Customer; một sản phẩm không trùng trong cùng giỏ |
| Giao dịch | Orders, OrderDetails, Payments, Coupons | Snapshot đơn; thanh toán tách trạng thái giao; voucher có hạn mức |
| Kho | Inventory, InventoryTransactions | Một SKU/một kho logic; biến động có trước/sau và tham chiếu |
| Phản hồi | Reviews, Notifications | Đánh giá đúng đơn hợp lệ; thông báo đúng người nhận |
| Tư vấn | AIChatHistory, ProductViews, Recommendations | Không lộ dữ liệu cá nhân; kết quả gợi ý dùng sản phẩm hợp lệ |
| Truy vết (đề xuất bổ sung) | OrderStatusHistory, CheckoutIdempotency | Lưu thay đổi trạng thái và chống tạo đơn lặp |

### 10.2. Danh mục thuộc tính cần chuẩn hóa

SKU thể hiện biến thể bán có tồn riêng. Ví dụ `DOP-LAP-001` chỉ là **quy ước minh họa**. Cần xác định chuẩn SKU, cấm trùng và chính sách sửa mã đã xuất hiện trong đơn. Các thuộc tính dùng để lọc/gợi ý cần có kiểu và đơn vị: `RAM_GB`, `Storage_GB`, `Weight_KG`, kích thước màn hình inch, loại CPU/GPU, giá VND. Không so sánh chuỗi thông số tự do như dữ liệu số đã được chuẩn hóa.

### 10.3. Snapshot lịch sử giao dịch

`OrderDetails` tối thiểu nên giữ `ProductID` tham chiếu và snapshot `SKU`, tên, đơn giá, số lượng, thành tiền. `Orders` giữ thông tin nhận hàng tại thời điểm đặt. Thay đổi bảng Products hoặc Addresses về sau không được làm biến đổi giao dịch lịch sử.

### 10.4. Ràng buộc và chỉ mục đề xuất

- `UNIQUE` cho `Products.SKU`, mã đơn, định danh nghiệp vụ checkout.
- `CHECK` cho giá, số lượng, trạng thái hợp lệ; khóa ngoại đầy đủ.
- `UNIQUE (CartID, ProductID)` nếu giỏ chỉ cho một dòng/SKU.
- Filtered unique index hoặc giao dịch thích hợp để **tối đa một địa chỉ mặc định/Customer**.
- Chỉ mục theo khóa ngoại, SKU, mã đơn, trạng thái-ngày đơn và các đường tìm kiếm có tần suất thực tế.
- Dùng số nguyên/DECIMAL thích hợp cho số lượng và tiền VND; thống nhất múi giờ của timestamp.

Đây là yêu cầu thiết kế, **chưa phải ERD vật lý hay xác nhận tên cột trong database hiện tại**. Tên trường và kiểu cần kiểm tra lại với SQL schema.

## 11. ĐỐI CHIẾU NGUYÊN MẪU VÀ KHOẢNG TRỐNG

| Nhóm | Thông tin nêu trong v1.0 | Cần làm trước nghiệm thu |
|---|---|---|
| Checkout–kho–thanh toán | Có mô tả transaction/khóa/chống lặp | Kiểm tra code thực; test timeout, gửi đồng thời, lịch sử và tính nguyên tử |
| Phân quyền | Đã có xác thực vai trò và phiên theo báo cáo | RBAC chi tiết từng API và sở hữu tài nguyên; test 401/403/404 |
| Sản phẩm | Có màn tra cứu/quản trị | Lọc phân trang, trạng thái và kho; test SKU/giá/giảm giá |
| Voucher | Có áp dụng và giới hạn | Chốt 0/NULL; tranh lượt cuối; giới hạn % và giá trị giảm |
| Địa chỉ | Có xem/thêm theo báo cáo | Đảm bảo mặc định nguyên tử; sửa/xóa/chọn và lỗi giữa chừng |
| AI | Có nhánh luật và diễn đạt tùy cấu hình | Chuẩn hóa giá/khoảng/PC Gaming; no-result, timeout, bắt buộc-lọc trước |
| Báo cáo | Có doanh thu, bán chạy theo báo cáo | Chốt mẫu số, giảm giá, phí ship, CompletedUnits, đối soát |
| Vận hành | Có README và health theo báo cáo | Reproduce setup, kiểm tra DB/AI riêng, backup/restore thử |
| Cấu trúc mã | Đã phân tầng một phần | Di chuyển business rules khỏi routes, quản lý mã cũ bằng VCS |

**Bằng chứng đã nêu từ bản v1.0:** “8 kiểm thử quy tắc, 13 kịch bản tích hợp đạt và frontend build thành công”. Chưa có log/test report kèm theo trong lần biên soạn này; phải đính kèm và chạy lại trước khi kết luận đã đạt.

## 12. KẾ HOẠCH KIỂM THỬ VÀ ĐÁNH GIÁ

### 12.1. Nhóm ca kiểm thử nghiệp vụ ưu tiên

| ID | Tình huống | Kết quả mong đợi |
|---|---|---|
| TC-01 | Đặt COD và xử lý PENDING→COMPLETED | Đơn/hàng/kho/thanh toán/lịch sử đúng quy tắc |
| TC-02 | Trả trước chưa PAID, yêu cầu PACKING | Bị từ chối nếu chính sách trả trước đã chốt |
| TC-03 | Thanh toán mô phỏng đúng đơn rồi hoàn tất | Cho chuyển trạng thái hợp lệ, không trả tiền thật |
| TC-04 | Hủy PENDING/CONFIRMED; gửi hủy lặp | CANCELLED; tồn/voucher chỉ hoàn một lần |
| TC-05 | Thanh toán sau CANCELLED | Bị từ chối, không chuyển PAID |
| TC-06 | Hai khách tranh SKU tồn cuối | Tối đa một đơn thành công vượt kiểm tra tồn |
| TC-07 | Hai khách tranh lượt voucher cuối | Không vượt UsageLimit |
| TC-08 | Hai yêu cầu checkout cùng key chạy đồng thời | Một đơn duy nhất; lần gửi sau nhận kết quả tương ứng |
| TC-09 | Checkout commit nhưng trình duyệt timeout | Tra lại được đơn; retry cùng key không nhân đôi |
| TC-10 | Thay giá/tắt danh mục sau khi thêm giỏ | Backend tính lại, cảnh báo và yêu cầu xác nhận lại |
| TC-11 | Customer truy cập đơn Customer khác | Bị từ chối, không rò rỉ dữ liệu |
| TC-12 | Staff gọi API thay vai trò/giảm tồn | Bị từ chối |
| TC-13 | Review trước/sau COMPLETED; kiểm duyệt | Đúng điều kiện mua, điểm công khai cập nhật |
| TC-14 | Hai thao tác đặt mặc định địa chỉ cùng lúc | Không có hai địa chỉ mặc định |
| TC-15 | AI hỏi mức giá/danh mục/thuộc tính/no result | Không vi phạm điều kiện bắt buộc, có giải thích |
| TC-16 | SQL Server mất kết nối; AI provider lỗi | Phân biệt trạng thái; lỗi có xử lý, fallback AI theo luật |
| TC-17 | Rollback khi lỗi giữa nhiều lệnh SQL | Không để dữ liệu đơn/kho/voucher dở dang |
| TC-18 | Đối chiếu báo cáo với bộ seed cố định | Kết quả bằng phép tính độc lập theo KPI công bố |

### 12.2. Bộ đánh giá AI

Tối thiểu **60 câu** trên tập dữ liệu danh mục cố định, gồm: danh mục, giá dưới/trên/khoảng, ngôn ngữ tiền tệ, RAM/SSD, nhu cầu học/làm việc/chơi game, câu nối tiếp, đổi tiêu chí, thiếu thông số, không có kết quả, timeout. Phải có một tập câu chưa dùng khi điều chỉnh luật để kiểm tra khả năng tổng quát hóa.

Ghi riêng tỷ lệ phân tích đúng ý định, tỷ lệ gợi ý vi phạm ràng buộc bắt buộc, tỷ lệ phản hồi đúng no-result, fallback và phân bố thời gian phản hồi. **Mục tiêu:** không gợi ý sản phẩm vi phạm tiêu chí đã nhận diện là bắt buộc; **chưa báo cáo tỷ lệ thực tế** khi chưa đo.

### 12.3. Đánh giá khả năng sử dụng

Mời nhóm người dùng nhỏ thực hiện bốn tác vụ: tìm theo ngân sách, so sánh, đặt hàng, tra cứu đơn. Ghi số người, tiêu chí chọn, tỷ lệ hoàn thành, lỗi thao tác, thời gian và phản hồi. Không suy rộng kết quả nhóm nhỏ thành kết luận cho toàn bộ khách hàng.

### 12.4. Lưu minh chứng

Mỗi test case có precondition, bộ dữ liệu, bước, expected, actual, trạng thái Pass/Fail, thời điểm, ảnh/log/API response và tham chiếu commit. Kết quả test cũ phải được chạy lại sau khi thay đổi quy tắc thanh toán/voucher/kho.

## 13. QUYẾT ĐỊNH, GIẢ ĐỊNH VÀ VẤN ĐỀ CẦN PHÊ DUYỆT

| ID | Vấn đề | Phương án làm việc ở v1.1 | Trạng thái/xác minh |
|---|---|---|---|
| DEC-01 | Cửa hàng/kho | Một cửa hàng, một kho logic | Giả định; hỏi GVHD/đơn vị giả định |
| DEC-02 | Trừ kho | Giảm tồn khả dụng tại checkout; không giữ riêng | Đề xuất theo code được mô tả; xác minh schema |
| DEC-03 | Trả trước | Phải PAID trước PACKING | **Chưa chốt**; đối chiếu code/chính sách |
| DEC-04 | Hủy | Customer sở hữu đơn/Admin; chỉ từ PENDING/CONFIRMED | Cần xác nhận đường API và phân quyền |
| DEC-05 | Voucher | NULL = không giới hạn, 0 = không được dùng | Đề xuất; kiểm tra migration dữ liệu cũ |
| DEC-06 | Báo cáo | Giá trị đơn COMPLETED sau giảm + phí giao; KPI riêng hàng hóa | Đề xuất giữ cách hiểu v1.0; xác nhận với GVHD |
| DEC-07 | Đã bán | CompletedUnits dùng cho bán chạy, khác OrderedUnits | Cần đối chiếu SoldCount hiện hữu |
| DEC-08 | AI | Luật lọc từ SQL là nguồn sự thật; LLM chỉ diễn đạt | Quyết định phạm vi, xác minh fallback |
| DEC-09 | Thời gian thực hiện | Theo lịch đề cương được duyệt | Chưa có lịch chính xác trong bản này |
| DEC-10 | Tên đề tài | Không tự thay tên đã đăng ký | Chờ đối chiếu hồ sơ chính thức |
| DEC-11 | Quyền Staff | Chuyển trạng thái hợp lệ, nhập tăng; không hủy/giảm kho/quản vai trò | Đề xuất, chốt ma trận API |
| DEC-12 | Thanh toán | COD + mô phỏng trả trước; không có tiền thật | Xác nhận phạm vi demo |

Các quyết định chưa chốt phải được ký nhận/ghi biên bản trước khi khóa SRS. Nếu quy tắc được đổi, cần cập nhật đồng thời use case, API, database, UI và test case.

## 14. KẾT LUẬN VÀ BƯỚC TIẾP THEO

DopTech được xác định là **hệ thống thông tin hỗ trợ bán lẻ thiết bị công nghệ** theo mô hình một cửa hàng/một kho logic. Trọng tâm tốt nghiệp là tính nhất quán của **đơn hàng – thanh toán – tồn kho – quyền truy cập**, còn tư vấn AI là khả năng hỗ trợ tìm lựa chọn từ dữ liệu sản phẩm đã được chuẩn hóa.

Bản v1.1 đã chuyển các điểm gây mơ hồ của v1.0 thành quy tắc đề xuất, danh mục quyết định chờ xác nhận và tiêu chí kiểm thử. Dù vậy, nó vẫn là **tài liệu phân tích**; chưa thay thế SRS, ERD vật lý, đặc tả API hay biên bản kiểm thử thực tế.

**Trình tự triển khai tiếp theo:**

1. Chốt DEC-02, DEC-03, DEC-04, DEC-05, DEC-06, DEC-07 và ma trận Staff/Admin.
2. Lập **SRS** với yêu cầu, tiền/hậu điều kiện, ngoại lệ và acceptance criteria.
3. Vẽ Use Case, Activity/Sequence (checkout, payment, cancel, inventory) và state machine.
4. Thiết kế ERD vật lý, Data Dictionary, khóa/ràng buộc và hợp đồng API.
5. Liên kết yêu cầu → mã nguồn → test case; xử lý các rủi ro P0 trước phần mở rộng.
6. Chạy lại test, lưu bằng chứng, đo hiệu năng và thử khôi phục DB.
7. Hoàn thiện hướng dẫn demo và giới hạn của mô hình giả định trong báo cáo tốt nghiệp.

---

# PHỤ LỤC A — MA TRẬN TRUY VẾT YÊU CẦU (KHỞI TẠO)

Bảng này là **ma trận kế hoạch**. Cột kết quả để trống cho tới khi chạy thử; không được tự ghi “PASS”.

| Yêu cầu | Quy tắc chính | Module | Ca kiểm thử ưu tiên | Kết quả hiện tại |
|---|---|---|---|---|
| FR-01 | BR-01 | Auth/RBAC | TC-11, TC-12 | Chưa xác minh |
| FR-02 | BR-02, BR-10 | Catalog | TC-10 | Chưa xác minh |
| FR-03 | BR-12 | Search/Compare | TC-15 (bộ lọc) | Chưa xác minh |
| FR-04 | BR-03 | Cart | TC-06, TC-10 | Chưa xác minh |
| FR-05 | BR-03, BR-04, BR-05, BR-07 | Checkout | TC-06, TC-08, TC-09, TC-17 | Chưa xác minh |
| FR-06 | BR-06 | Coupons | TC-07 | Chưa xác minh |
| FR-07 | BR-01, BR-08 | Orders | TC-01, TC-04 | Chưa xác minh |
| FR-08 | BR-08, BR-09, BR-16 | Orders/Payments | TC-02–TC-05 | Chưa xác minh |
| FR-09 | BR-03, BR-15 | Inventory | TC-04, TC-06, TC-17 | Chưa xác minh |
| FR-10 | BR-13 | Profile/Addresses | TC-14 | Chưa xác minh |
| FR-11 | BR-14 | Reviews | TC-13 | Chưa xác minh |
| FR-12 | BR-12 | AI | TC-15, TC-16 | Chưa xác minh |
| FR-13 | KPI §6.7 | Reports | TC-18 | Chưa xác minh |
| FR-14 | NFR-04, NFR-08 | Operations | TC-16 + restore | Chưa xác minh |

# PHỤ LỤC B — MẪU USE CASE CHÍNH: ĐẶT HÀNG

| Thuộc tính | Nội dung |
|---|---|
| Mã | UC-CHECKOUT-01 |
| Tên | Đặt hàng từ giỏ |
| Tác nhân | Customer |
| Tiền điều kiện | Đã xác thực; giỏ có ít nhất một sản phẩm; địa chỉ hợp lệ |
| Kích hoạt | Nhấn xác nhận đặt hàng |
| Luồng thành công | Xác minh thông tin → tính lại giá/tồn/voucher → xác nhận tổng → ghi idempotency → transaction tạo đơn, giảm tồn, ghi thanh toán mô phỏng và lịch sử → trả mã đơn |
| Hậu điều kiện | Đơn PENDING duy nhất cho request; snapshot và dòng hàng đúng; kho/voucher/giỏ đã cập nhật nguyên tử |
| Ngoại lệ | Tồn thiếu; giá đổi; voucher lỗi; payload sai; rollback; response timeout; request lặp |
| Bảo mật | Chỉ Customer; giỏ/địa chỉ thuộc chủ yêu cầu; không tin giá client |
| Minh chứng | TC-06, TC-07, TC-08, TC-09, TC-10, TC-17 |

# PHỤ LỤC C — THỨ TỰ ƯU TIÊN PHÁT TRIỂN

| Mức | Nhóm công việc | Kết quả đầu ra |
|---|---|---|
| P0 | Chốt thanh toán, hủy, kho, chống lặp, RBAC | Quy tắc không mâu thuẫn, API và test trọng yếu |
| P1 | SKU/spec chuẩn, voucher, địa chỉ, báo cáo, AI bắt buộc-lọc | CSDL/logic đúng, có bộ dữ liệu đối soát |
| P1 | SRS, ERD, Data Dictionary, UML | Tài liệu phân tích-thiết kế có truy vết |
| P2 | Health/log, backup, hiệu năng, accessibility | Môi trường demo ổn định, có bằng chứng đo |
| Sau tốt nghiệp | Tương thích linh kiện PC, nhiều kho, đổi trả, tích hợp thật | Đề xuất phát triển, không tính vào nghiệm thu 1.1 |

# PHỤ LỤC D — DANH SÁCH TÀI LIỆU/BẰNG CHỨNG CÒN THIẾU

1. README đúng phiên bản mã nguồn đang sử dụng, có lệnh chạy và cấu hình không chứa bí mật.
2. `REVIEW-MA-NGUON.md` để đối chiếu chính xác các nhận xét và số ca kiểm thử đã được nêu.
3. SQL schema/migration và dữ liệu seed hiện hành để rà soát khóa, CHECK, UNIQUE, tồn và voucher.
4. Mã nguồn Backend cho checkout/cancel/payment/AI và các endpoint phân quyền cần kiểm chứng.
5. Báo cáo test với đầu vào, kết quả và ngày chạy; log kiểm thử đồng thời và timeout.
6. Quyết định/biên bản của giảng viên về tên chính thức, phạm vi và chính sách thanh toán.
7. Nếu có: dữ liệu khảo sát thử người dùng hoặc cửa hàng để thay thế giả định bằng minh chứng.

**Ghi chú cuối:** Không đánh đồng “đã đề xuất”, “đã hiện diện trong code” và “đã kiểm thử đạt”. Khi đưa tài liệu này vào báo cáo chính thức, ghi phiên bản, ngày và căn cứ xác nhận cho từng quyết định nghiệp vụ.
