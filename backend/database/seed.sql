USE DopTechDB;
GO
SET NOCOUNT ON;

INSERT INTO Roles(RoleName, Description) VALUES
('ADMIN',N'Quản trị viên'),('STAFF',N'Nhân viên'),('CUSTOMER',N'Khách hàng');

DECLARE @AdminHash VARCHAR(255)='$2b$10$E8DVyrkbha/HR7OBhJ9CFOGDcgLp2rI1GXxbRaTPNEbx7hFiZNEe.';
DECLARE @StaffHash VARCHAR(255)='$2b$10$Io5Yp5Xeo/VOL.RrroaRVOHKPen4PMZWT1KGobhp5rHKsRZMT3ru6';
DECLARE @CustomerHash VARCHAR(255)='$2b$10$XalIR5sS7m7DqCf1XQEgaOxT1g2OVQXNqmW5Hr4sugk8KWs1Fw/6O';

INSERT INTO Users(RoleID,FullName,Email,Phone,PasswordHash) VALUES
(1,N'DopTech Admin','admin@doptech.local','0900000001',@AdminHash),
(2,N'Nguyễn Minh Staff','staff@doptech.local','0900000002',@StaffHash),
(2,N'Trần An Staff','staff2@doptech.local','0900000003',@StaffHash),
(3,N'Khách hàng Demo','customer@doptech.local','0900000010',@CustomerHash),
(3,N'Nguyễn Văn An','customer2@doptech.local','0900000011',@CustomerHash),
(3,N'Trần Thị Bình','customer3@doptech.local','0900000012',@CustomerHash),
(3,N'Lê Minh Châu','customer4@doptech.local','0900000013',@CustomerHash),
(3,N'Phạm Gia Duy','customer5@doptech.local','0900000014',@CustomerHash),
(3,N'Hoàng Thu Hà','customer6@doptech.local','0900000015',@CustomerHash),
(3,N'Võ Quốc Huy','customer7@doptech.local','0900000016',@CustomerHash),
(3,N'Đặng Khánh Linh','customer8@doptech.local','0900000017',@CustomerHash),
(3,N'Bùi Nhật Nam','customer9@doptech.local','0900000018',@CustomerHash),
(3,N'Đỗ Phương Oanh','customer10@doptech.local','0900000019',@CustomerHash);

INSERT INTO Staff(UserID,StaffCode,Position,HireDate) VALUES
(2,'STF001',N'Nhân viên bán hàng','2026-01-10'),(3,'STF002',N'Nhân viên kho','2026-02-15');
INSERT INTO Customers(UserID,LoyaltyPoints) SELECT UserID, (UserID-3)*100 FROM Users WHERE RoleID=3;

INSERT INTO Categories(CategoryName,Slug) VALUES
(N'Laptop','laptop'),(N'Điện thoại','dien-thoai'),(N'Tablet','tablet'),(N'PC Gaming','pc-gaming'),
(N'CPU','cpu'),(N'GPU','gpu'),(N'RAM','ram'),(N'SSD','ssd'),(N'Mainboard','mainboard'),
(N'Màn hình','man-hinh'),(N'Bàn phím','ban-phim'),(N'Chuột','chuot'),(N'Tai nghe','tai-nghe'),
(N'Webcam','webcam'),(N'Loa','loa'),(N'Sạc','sac'),(N'Cáp','cap'),(N'Phụ kiện','phu-kien');

INSERT INTO Brands(BrandName,Slug) VALUES
(N'Apple','apple'),(N'Samsung','samsung'),(N'ASUS','asus'),(N'Acer','acer'),(N'Dell','dell'),(N'HP','hp'),
(N'Lenovo','lenovo'),(N'MSI','msi'),(N'Logitech','logitech'),(N'Razer','razer'),(N'Corsair','corsair'),
(N'Kingston','kingston'),(N'Intel','intel'),(N'AMD','amd'),(N'NVIDIA','nvidia'),(N'Sony','sony'),(N'Xiaomi','xiaomi');

INSERT INTO Products(ProductName,Slug,CategoryID,BrandID,Description,ShortDescription,Price,DiscountPrice,SKU,Thumbnail,Featured,SoldCount,AverageRating) VALUES
(N'MacBook Air M3 13','macbook-air-m3-13',1,1,N'Laptop mỏng nhẹ cho học tập, lập trình và công việc.',N'M3, 16GB RAM, 512GB SSD',29990000,28490000,'LAP-APL-001','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',1,92,4.8),
(N'MacBook Pro M3 14','macbook-pro-m3-14',1,1,N'Laptop hiệu năng cao cho lập trình và sáng tạo.',N'M3 Pro, màn hình Liquid Retina',45990000,43990000,'LAP-APL-002','https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',1,68,4.9),
(N'ASUS Vivobook 15','asus-vivobook-15',1,3,N'Laptop học tập văn phòng cân bằng.',N'Core i5, 16GB, 512GB SSD',16990000,15490000,'LAP-ASU-001','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',1,120,4.6),
(N'ASUS TUF Gaming F15','asus-tuf-gaming-f15',1,3,N'Laptop gaming phù hợp Android Studio và game eSports.',N'Core i7, RTX 4050, 16GB',26990000,24990000,'LAP-ASU-002','https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',1,155,4.7),
(N'Acer Nitro V 15','acer-nitro-v-15',1,4,N'Laptop gaming tầm trung.',N'Core i5, RTX 4050',23990000,22490000,'LAP-ACE-001','https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',1,104,4.5),
(N'Dell Inspiron 15','dell-inspiron-15',1,5,N'Laptop học tập và văn phòng bền bỉ.',N'Core i5, 16GB',17990000,NULL,'LAP-DEL-001','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',0,76,4.4),
(N'Lenovo Legion 5','lenovo-legion-5',1,7,N'Laptop gaming và đồ họa mạnh.',N'Ryzen 7, RTX 4060',32990000,30990000,'LAP-LEN-001','https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',1,88,4.8),
(N'HP Pavilion 14','hp-pavilion-14',1,6,N'Laptop gọn nhẹ cho sinh viên.',N'Core i5, 16GB',18990000,17990000,'LAP-HP-001','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',0,65,4.5),
(N'MSI Modern 14','msi-modern-14',1,8,N'Laptop học tập và làm việc linh hoạt.',N'Ryzen 5, 16GB',15990000,NULL,'LAP-MSI-001','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',0,54,4.3),
(N'Lenovo IdeaPad Slim 5','lenovo-ideapad-slim-5',1,7,N'Laptop đa dụng hiệu quả.',N'Ryzen 7, 16GB, 512GB',19990000,18990000,'LAP-LEN-002','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',1,84,4.6),
(N'iPhone 16 128GB','iphone-16-128gb',2,1,N'Điện thoại iOS hiệu năng cao.',N'Camera đẹp, chip Apple',22990000,21990000,'PHO-APL-001','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',1,190,4.8),
(N'iPhone 15 128GB','iphone-15-128gb',2,1,N'iPhone cân bằng hiệu năng và camera.',N'128GB, USB-C',18990000,17490000,'PHO-APL-002','https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',1,220,4.7),
(N'Samsung Galaxy S25','samsung-galaxy-s25',2,2,N'Flagship Android cao cấp.',N'AMOLED, camera AI',24990000,23490000,'PHO-SAM-001','https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',1,170,4.8),
(N'Samsung Galaxy A56','samsung-galaxy-a56',2,2,N'Điện thoại tầm trung pin tốt.',N'5G, AMOLED',10990000,9990000,'PHO-SAM-002','https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800',1,210,4.6),
(N'Xiaomi 14T','xiaomi-14t',2,17,N'Điện thoại hiệu năng cao giá hợp lý.',N'Camera Leica, sạc nhanh',13990000,12990000,'PHO-XIA-001','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',1,145,4.5),
(N'Xiaomi Redmi Note 14','xiaomi-redmi-note-14',2,17,N'Điện thoại phổ thông màn hình đẹp.',N'AMOLED, pin lớn',6990000,6490000,'PHO-XIA-002','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',0,180,4.4),
(N'iPad Air M2','ipad-air-m2',3,1,N'Tablet học tập và sáng tạo.',N'M2, 11 inch',16990000,15990000,'TAB-APL-001','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',1,95,4.8),
(N'Samsung Galaxy Tab S10','galaxy-tab-s10',3,2,N'Tablet Android cao cấp.',N'AMOLED, S Pen',18990000,NULL,'TAB-SAM-001','https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',0,58,4.6),
(N'PC Gaming DopTech RTX 4060','pc-gaming-doptech-rtx-4060',4,3,N'PC gaming lắp sẵn cho 1080p/1440p.',N'Ryzen 5, RTX 4060, 16GB',24990000,23490000,'PC-DOP-001','https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',1,66,4.7),
(N'PC Gaming DopTech RTX 4070','pc-gaming-doptech-rtx-4070',4,8,N'PC gaming mạnh cho game và đồ họa.',N'Core i7, RTX 4070, 32GB',39990000,37990000,'PC-DOP-002','https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',1,44,4.8),
(N'Intel Core i5-14600K','intel-core-i5-14600k',5,13,N'CPU desktop hiệu năng cao.',N'14 nhân, socket LGA1700',8490000,7990000,'CPU-INT-001','https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',0,83,4.7),
(N'Intel Core i7-14700K','intel-core-i7-14700k',5,13,N'CPU mạnh cho game và công việc.',N'20 nhân, LGA1700',11990000,11490000,'CPU-INT-002','https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',1,71,4.8),
(N'AMD Ryzen 5 7600','amd-ryzen-5-7600',5,14,N'CPU AM5 cân bằng giá hiệu năng.',N'6 nhân 12 luồng',5490000,5190000,'CPU-AMD-001','https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',1,98,4.7),
(N'AMD Ryzen 7 7800X3D','amd-ryzen-7-7800x3d',5,14,N'CPU gaming mạnh.',N'8 nhân 16 luồng, 3D V-Cache',10990000,10490000,'CPU-AMD-002','https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',1,132,4.9),
(N'NVIDIA GeForce RTX 4060','nvidia-geforce-rtx-4060',6,15,N'GPU gaming 1080p hiệu quả.',N'8GB GDDR6',8990000,8490000,'GPU-NVI-001','https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',1,149,4.6),
(N'NVIDIA GeForce RTX 4070 Super','nvidia-geforce-rtx-4070-super',6,15,N'GPU gaming 1440p mạnh.',N'12GB GDDR6X',16990000,16290000,'GPU-NVI-002','https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',1,88,4.8),
(N'Corsair Vengeance 16GB DDR5','corsair-vengeance-16gb-ddr5',7,11,N'RAM DDR5 hiệu năng ổn định.',N'16GB 5600MHz',1590000,1490000,'RAM-COR-001','https://images.unsplash.com/photo-1562976540-1502c2145186?w=800',0,170,4.7),
(N'Kingston Fury 32GB DDR5','kingston-fury-32gb-ddr5',7,12,N'RAM 32GB cho gaming và lập trình.',N'32GB 6000MHz',2990000,2790000,'RAM-KIN-001','https://images.unsplash.com/photo-1562976540-1502c2145186?w=800',1,125,4.8),
(N'Kingston NV3 1TB','kingston-nv3-1tb',8,12,N'SSD NVMe tốc độ cao.',N'1TB PCIe 4.0',1890000,1690000,'SSD-KIN-001','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',1,240,4.7),
(N'Kingston KC3000 2TB','kingston-kc3000-2tb',8,12,N'SSD NVMe hiệu năng cao.',N'2TB PCIe 4.0',3990000,3790000,'SSD-KIN-002','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',0,79,4.8),
(N'ASUS TUF B650-PLUS','asus-tuf-b650-plus',9,3,N'Mainboard AM5 gaming bền bỉ.',N'B650, DDR5, WiFi',5290000,4990000,'MB-ASU-001','https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',0,62,4.7),
(N'MSI B760 Gaming Plus','msi-b760-gaming-plus',9,8,N'Mainboard Intel DDR5.',N'B760, WiFi',4590000,4390000,'MB-MSI-001','https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',0,54,4.6),
(N'ASUS TUF VG27AQ3A','asus-tuf-vg27aq3a',10,3,N'Màn hình gaming QHD.',N'27 inch, 180Hz',6990000,6490000,'MON-ASU-001','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',1,91,4.7),
(N'Dell UltraSharp U2724D','dell-ultrasharp-u2724d',10,5,N'Màn hình làm việc màu sắc tốt.',N'27 inch QHD IPS',9990000,9490000,'MON-DEL-001','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',0,43,4.8),
(N'Corsair K70 RGB','corsair-k70-rgb',11,11,N'Bàn phím cơ gaming.',N'Mechanical RGB',3990000,3690000,'KEY-COR-001','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',1,112,4.7),
(N'Razer BlackWidow V4','razer-blackwidow-v4',11,10,N'Bàn phím cơ RGB cho game.',N'Mechanical, RGB',4490000,4190000,'KEY-RAZ-001','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',0,78,4.6),
(N'Logitech MX Keys S','logitech-mx-keys-s',11,9,N'Bàn phím văn phòng cao cấp.',N'Wireless, đa thiết bị',2890000,2690000,'KEY-LOG-001','https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',1,136,4.8),
(N'Logitech G Pro X Superlight 2','logitech-g-pro-x-superlight-2',12,9,N'Chuột gaming không dây nhẹ.',N'60g, HERO 2',3490000,3290000,'MOU-LOG-001','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',1,220,4.9),
(N'Logitech G502 X','logitech-g502-x',12,9,N'Chuột gaming nhiều nút.',N'HERO 25K',1890000,1690000,'MOU-LOG-002','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',1,190,4.7),
(N'Razer DeathAdder V3','razer-deathadder-v3',12,10,N'Chuột gaming công thái học.',N'30K DPI',1990000,1790000,'MOU-RAZ-001','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',0,118,4.6),
(N'Razer Viper V3 Hyperspeed','razer-viper-v3-hyperspeed',12,10,N'Chuột gaming wireless.',N'30K DPI, nhẹ',1590000,1490000,'MOU-RAZ-002','https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',0,92,4.5),
(N'Sony WH-1000XM5','sony-wh-1000xm5',13,16,N'Tai nghe chống ồn cao cấp.',N'ANC, Bluetooth',8990000,8490000,'HDP-SON-001','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',1,105,4.8),
(N'Logitech G733','logitech-g733',13,9,N'Tai nghe gaming không dây.',N'Wireless, RGB',3190000,2990000,'HDP-LOG-001','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',0,88,4.6),
(N'Logitech Brio 4K','logitech-brio-4k',14,9,N'Webcam 4K cho học và họp trực tuyến.',N'4K HDR',3990000,3690000,'WEB-LOG-001','https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800',0,59,4.7),
(N'Logitech C920','logitech-c920',14,9,N'Webcam Full HD phổ biến.',N'1080p',1890000,1690000,'WEB-LOG-002','https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800',0,145,4.6),
(N'Logitech Z407','logitech-z407',15,9,N'Loa máy tính Bluetooth.',N'2.1, wireless control',2490000,2290000,'SPK-LOG-001','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',0,73,4.5),
(N'Sony SRS-XB100','sony-srs-xb100',15,16,N'Loa Bluetooth nhỏ gọn.',N'Chống nước, pin lâu',1390000,1290000,'SPK-SON-001','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',0,101,4.6),
(N'Apple USB-C 30W Adapter','apple-usb-c-30w-adapter',16,1,N'Sạc USB-C chính hãng mẫu.',N'30W',1190000,NULL,'CHA-APL-001','https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',0,87,4.6),
(N'Samsung 45W Charger','samsung-45w-charger',16,2,N'Sạc nhanh USB-C.',N'45W PD',990000,890000,'CHA-SAM-001','https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800',0,133,4.5),
(N'Anker USB-C Cable 100W','anker-usb-c-cable-100w',17,3,N'Cáp USB-C sạc nhanh.',N'100W, 1.8m',390000,349000,'CAB-ANK-001','https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=800',0,180,4.6),
(N'Laptop Stand Aluminum','laptop-stand-aluminum',18,5,N'Giá đỡ laptop nhôm.',N'Điều chỉnh góc nhìn',590000,499000,'ACC-DOP-001','https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800',0,95,4.5);

INSERT INTO ProductImages(ProductID,ImageUrl,IsPrimary,SortOrder)
SELECT ProductID,Thumbnail,1,1 FROM Products WHERE Thumbnail IS NOT NULL;

-- Flexible specifications for representative product groups.
INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder)
SELECT ProductID,N'RAM',CASE WHEN CategoryID=1 THEN N'16GB' ELSE N'—' END,1 FROM Products WHERE CategoryID=1;
INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder)
SELECT ProductID,N'Storage',CASE WHEN CategoryID=1 THEN N'512GB SSD' WHEN CategoryID=2 THEN N'128GB' ELSE N'—' END,2 FROM Products WHERE CategoryID IN (1,2);
INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder)
SELECT ProductID,N'Screen',CASE WHEN CategoryID=1 THEN N'14-15.6 inch' ELSE N'AMOLED/OLED' END,3 FROM Products WHERE CategoryID IN (1,2,3);
INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder)
SELECT ProductID,N'CPU',CASE WHEN ProductName LIKE N'%TUF%' THEN N'Intel Core i7' WHEN ProductName LIKE N'%Legion%' THEN N'AMD Ryzen 7' ELSE N'Intel/AMD/Apple Silicon' END,4 FROM Products WHERE CategoryID=1;
INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder)
SELECT ProductID,N'GPU',CASE WHEN ProductName LIKE N'%Gaming%' OR ProductName LIKE N'%Legion%' OR ProductName LIKE N'%Nitro%' THEN N'NVIDIA RTX' ELSE N'Integrated GPU' END,5 FROM Products WHERE CategoryID=1;

INSERT INTO Inventory(ProductID,Quantity,ReorderLevel)
SELECT ProductID, CASE WHEN ProductID % 13=0 THEN 3 ELSE 10 + (ProductID * 7) % 55 END, CASE WHEN ProductID % 6=0 THEN 8 ELSE 5 END FROM Products;
INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,Note)
SELECT ProductID,'IMPORT',Quantity,0,Quantity,N'Tồn kho khởi tạo' FROM Inventory;

INSERT INTO Coupons(Code,DiscountType,DiscountValue,MinOrderValue,MaxDiscount,StartDate,EndDate,UsageLimit,Status) VALUES
('DOPTECH10','PERCENT',10,1000000,1000000,'2026-01-01','2027-12-31',500,'ACTIVE'),
('GIAM200K','FIXED',200000,5000000,NULL,'2026-01-01','2027-12-31',200,'ACTIVE'),
('FREESHIP','FIXED',50000,500000,NULL,'2026-01-01','2027-12-31',1000,'ACTIVE');

INSERT INTO Carts(UserID) SELECT UserID FROM Users WHERE RoleID=3;
INSERT INTO Wishlists(UserID) SELECT UserID FROM Users WHERE RoleID=3;
INSERT INTO Addresses(UserID,ReceiverName,ReceiverPhone,AddressLine,Ward,District,Province,IsDefault)
SELECT UserID,FullName,ISNULL(Phone,'0900000000'),N'01 Đường Demo',N'Phường Thuận Hóa',N'Quận Thuận Hóa',N'Thành phố Huế',1 FROM Users WHERE RoleID=3;

-- 30 coherent demo orders with details/payments.
DECLARE @i INT=1, @uid INT, @pid INT, @oid INT, @qty INT, @price DECIMAL(18,2), @status VARCHAR(20), @code VARCHAR(30);
WHILE @i <= 30
BEGIN
  SET @uid = 4 + ((@i-1) % 10);
  SET @pid = 1 + ((@i*3-1) % 50);
  SET @qty = 1 + (@i % 2);
  SELECT @price = COALESCE(DiscountPrice,Price) FROM Products WHERE ProductID=@pid;
  SET @status = CASE WHEN @i % 6 = 0 THEN 'CANCELLED' WHEN @i % 5 = 0 THEN 'SHIPPING' WHEN @i % 4 = 0 THEN 'PACKING' WHEN @i % 3 = 0 THEN 'CONFIRMED' ELSE 'COMPLETED' END;
  SET @code = CONCAT('DOP202609', RIGHT('0000'+CAST(@i AS VARCHAR(4)),4));
  INSERT INTO Orders(OrderCode,UserID,ReceiverName,ReceiverPhone,ReceiverEmail,ShippingAddress,Subtotal,DiscountAmount,ShippingFee,TotalAmount,Status,CreatedAt)
  SELECT @code,@uid,FullName,ISNULL(Phone,'0900000000'),Email,N'01 Đường Demo, Thành phố Huế',@price*@qty,0,30000,@price*@qty+30000,@status,DATEADD(DAY,-@i,SYSDATETIME()) FROM Users WHERE UserID=@uid;
  SET @oid=SCOPE_IDENTITY();
  INSERT INTO OrderDetails(OrderID,ProductID,ProductName,SKU,UnitPrice,Quantity)
  SELECT @oid,ProductID,ProductName,SKU,@price,@qty FROM Products WHERE ProductID=@pid;
  INSERT INTO Payments(OrderID,Method,Amount,Status,PaidAt)
  VALUES(@oid,CASE WHEN @i%4=0 THEN 'MOMO' WHEN @i%3=0 THEN 'VNPAY' ELSE 'COD' END,@price*@qty+30000,CASE WHEN @status='COMPLETED' THEN 'PAID' ELSE 'PENDING' END,CASE WHEN @status='COMPLETED' THEN DATEADD(DAY,-@i+1,SYSDATETIME()) ELSE NULL END);
  SET @i=@i+1;
END

INSERT INTO Reviews(UserID,ProductID,OrderID,Rating,Comment)
SELECT TOP 12 o.UserID,od.ProductID,o.OrderID,CAST(4 + (o.OrderID%2) AS TINYINT),N'Sản phẩm tốt, giao hàng ổn.'
FROM Orders o JOIN OrderDetails od ON o.OrderID=od.OrderID WHERE o.Status='COMPLETED' ORDER BY o.OrderID;

INSERT INTO ProductViews(UserID,ProductID,ViewedAt)
SELECT 4 + (n%10), 1 + ((n*7)%50), DATEADD(HOUR,-n,SYSDATETIME())
FROM (SELECT TOP 120 ROW_NUMBER() OVER(ORDER BY (SELECT NULL)) n FROM sys.all_objects) x;

INSERT INTO WishlistItems(WishlistID,ProductID)
SELECT w.WishlistID, 1 + ((w.WishlistID*4)%50) FROM Wishlists w;
INSERT INTO CartItems(CartID,ProductID,Quantity)
SELECT c.CartID, 1 + ((c.CartID*5)%50), 1 FROM Carts c WHERE c.CartID % 2=0;

INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID)
SELECT TOP 10 UserID,N'Chào mừng đến DopTech',N'Khám phá sản phẩm công nghệ và DopTech AI.', 'SYSTEM',NULL FROM Users WHERE RoleID=3;
GO
