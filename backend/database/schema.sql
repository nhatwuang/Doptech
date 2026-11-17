IF DB_ID('DopTechDB') IS NULL
BEGIN
    CREATE DATABASE DopTechDB;
END
GO
USE DopTechDB;
GO

IF OBJECT_ID('dbo.OrderStatusHistory','U') IS NOT NULL DROP TABLE dbo.OrderStatusHistory;
-- Drop in dependency order for repeatable classroom demo reset.
IF OBJECT_ID('dbo.Recommendations','U') IS NOT NULL DROP TABLE dbo.Recommendations;
IF OBJECT_ID('dbo.ProductViews','U') IS NOT NULL DROP TABLE dbo.ProductViews;
IF OBJECT_ID('dbo.AIChatHistory','U') IS NOT NULL DROP TABLE dbo.AIChatHistory;
IF OBJECT_ID('dbo.Notifications','U') IS NOT NULL DROP TABLE dbo.Notifications;
IF OBJECT_ID('dbo.Reviews','U') IS NOT NULL DROP TABLE dbo.Reviews;
IF OBJECT_ID('dbo.Payments','U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.OrderDetails','U') IS NOT NULL DROP TABLE dbo.OrderDetails;
IF OBJECT_ID('dbo.Orders','U') IS NOT NULL DROP TABLE dbo.Orders;
IF OBJECT_ID('dbo.Coupons','U') IS NOT NULL DROP TABLE dbo.Coupons;
IF OBJECT_ID('dbo.Addresses','U') IS NOT NULL DROP TABLE dbo.Addresses;
IF OBJECT_ID('dbo.WishlistItems','U') IS NOT NULL DROP TABLE dbo.WishlistItems;
IF OBJECT_ID('dbo.Wishlists','U') IS NOT NULL DROP TABLE dbo.Wishlists;
IF OBJECT_ID('dbo.CartItems','U') IS NOT NULL DROP TABLE dbo.CartItems;
IF OBJECT_ID('dbo.Carts','U') IS NOT NULL DROP TABLE dbo.Carts;
IF OBJECT_ID('dbo.InventoryTransactions','U') IS NOT NULL DROP TABLE dbo.InventoryTransactions;
IF OBJECT_ID('dbo.Inventory','U') IS NOT NULL DROP TABLE dbo.Inventory;
IF OBJECT_ID('dbo.ProductSpecifications','U') IS NOT NULL DROP TABLE dbo.ProductSpecifications;
IF OBJECT_ID('dbo.ProductImages','U') IS NOT NULL DROP TABLE dbo.ProductImages;
IF OBJECT_ID('dbo.Products','U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Brands','U') IS NOT NULL DROP TABLE dbo.Brands;
IF OBJECT_ID('dbo.Categories','U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.Staff','U') IS NOT NULL DROP TABLE dbo.Staff;
IF OBJECT_ID('dbo.Customers','U') IS NOT NULL DROP TABLE dbo.Customers;
IF OBJECT_ID('dbo.Users','U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles','U') IS NOT NULL DROP TABLE dbo.Roles;
GO

CREATE TABLE Roles (
  RoleID INT IDENTITY(1,1) PRIMARY KEY,
  RoleName VARCHAR(20) NOT NULL UNIQUE,
  Description NVARCHAR(255) NULL
);

CREATE TABLE Users (
  UserID INT IDENTITY(1,1) PRIMARY KEY,
  RoleID INT NOT NULL,
  FullName NVARCHAR(120) NOT NULL,
  Email VARCHAR(160) NOT NULL UNIQUE,
  Phone VARCHAR(20) NULL,
  PasswordHash VARCHAR(255) NOT NULL,
  Avatar NVARCHAR(500) NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Users_Status DEFAULT 'ACTIVE',
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Users_Roles FOREIGN KEY(RoleID) REFERENCES Roles(RoleID),
  CONSTRAINT CK_Users_Status CHECK(Status IN ('ACTIVE','INACTIVE','LOCKED'))
);
CREATE INDEX IX_Users_RoleID ON Users(RoleID);

CREATE TABLE Customers (
  CustomerID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  DateOfBirth DATE NULL,
  Gender VARCHAR(10) NULL,
  LoyaltyPoints INT NOT NULL CONSTRAINT DF_Customers_Points DEFAULT 0,
  CONSTRAINT FK_Customers_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
  CONSTRAINT CK_Customers_Gender CHECK(Gender IS NULL OR Gender IN ('MALE','FEMALE','OTHER')),
  CONSTRAINT CK_Customers_Points CHECK(LoyaltyPoints >= 0)
);

CREATE TABLE Staff (
  StaffID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  StaffCode VARCHAR(30) NOT NULL UNIQUE,
  Position NVARCHAR(100) NULL,
  HireDate DATE NULL,
  CONSTRAINT FK_Staff_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);

CREATE TABLE Categories (
  CategoryID INT IDENTITY(1,1) PRIMARY KEY,
  CategoryName NVARCHAR(120) NOT NULL UNIQUE,
  Slug VARCHAR(140) NOT NULL UNIQUE,
  Description NVARCHAR(500) NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Categories_Status DEFAULT 'ACTIVE',
  CONSTRAINT CK_Categories_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE Brands (
  BrandID INT IDENTITY(1,1) PRIMARY KEY,
  BrandName NVARCHAR(120) NOT NULL UNIQUE,
  Slug VARCHAR(140) NOT NULL UNIQUE,
  LogoUrl NVARCHAR(500) NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Brands_Status DEFAULT 'ACTIVE',
  CONSTRAINT CK_Brands_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE Products (
  ProductID INT IDENTITY(1,1) PRIMARY KEY,
  ProductName NVARCHAR(220) NOT NULL,
  Slug VARCHAR(240) NOT NULL UNIQUE,
  CategoryID INT NOT NULL,
  BrandID INT NOT NULL,
  Description NVARCHAR(MAX) NULL,
  ShortDescription NVARCHAR(700) NULL,
  Price DECIMAL(18,2) NOT NULL,
  DiscountPrice DECIMAL(18,2) NULL,
  SKU VARCHAR(80) NOT NULL UNIQUE,
  Thumbnail NVARCHAR(500) NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Products_Status DEFAULT 'ACTIVE',
  Featured BIT NOT NULL CONSTRAINT DF_Products_Featured DEFAULT 0,
  SoldCount INT NOT NULL CONSTRAINT DF_Products_Sold DEFAULT 0,
  AverageRating DECIMAL(3,2) NOT NULL CONSTRAINT DF_Products_Rating DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Products_Categories FOREIGN KEY(CategoryID) REFERENCES Categories(CategoryID),
  CONSTRAINT FK_Products_Brands FOREIGN KEY(BrandID) REFERENCES Brands(BrandID),
  CONSTRAINT CK_Products_Price CHECK(Price >= 0),
  CONSTRAINT CK_Products_DiscountPrice CHECK(DiscountPrice IS NULL OR (DiscountPrice >= 0 AND DiscountPrice <= Price)),
  CONSTRAINT CK_Products_Status CHECK(Status IN ('ACTIVE','INACTIVE','DISCONTINUED')),
  CONSTRAINT CK_Products_Rating CHECK(AverageRating BETWEEN 0 AND 5)
);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
CREATE INDEX IX_Products_BrandID ON Products(BrandID);
CREATE INDEX IX_Products_Status ON Products(Status);
CREATE INDEX IX_Products_Price ON Products(Price);

CREATE TABLE ProductImages (
  ImageID INT IDENTITY(1,1) PRIMARY KEY,
  ProductID INT NOT NULL,
  ImageUrl NVARCHAR(500) NOT NULL,
  IsPrimary BIT NOT NULL CONSTRAINT DF_ProductImages_Primary DEFAULT 0,
  SortOrder INT NOT NULL CONSTRAINT DF_ProductImages_Sort DEFAULT 0,
  CONSTRAINT FK_ProductImages_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID)
);
CREATE INDEX IX_ProductImages_ProductID ON ProductImages(ProductID);

CREATE TABLE ProductSpecifications (
  SpecificationID INT IDENTITY(1,1) PRIMARY KEY,
  ProductID INT NOT NULL,
  SpecName NVARCHAR(120) NOT NULL,
  SpecValue NVARCHAR(500) NOT NULL,
  SortOrder INT NOT NULL CONSTRAINT DF_ProductSpecs_Sort DEFAULT 0,
  CONSTRAINT FK_ProductSpecifications_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT UQ_ProductSpecifications UNIQUE(ProductID, SpecName)
);

CREATE TABLE Inventory (
  InventoryID INT IDENTITY(1,1) PRIMARY KEY,
  ProductID INT NOT NULL UNIQUE,
  Quantity INT NOT NULL CONSTRAINT DF_Inventory_Quantity DEFAULT 0,
  ReservedQuantity INT NOT NULL CONSTRAINT DF_Inventory_Reserved DEFAULT 0,
  ReorderLevel INT NOT NULL CONSTRAINT DF_Inventory_Reorder DEFAULT 5,
  UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Inventory_Updated DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Inventory_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT CK_Inventory_Quantity CHECK(Quantity >= 0 AND ReservedQuantity >= 0 AND ReorderLevel >= 0),
  CONSTRAINT CK_Inventory_Reserved CHECK(ReservedQuantity <= Quantity)
);

CREATE TABLE InventoryTransactions (
  TransactionID BIGINT IDENTITY(1,1) PRIMARY KEY,
  ProductID INT NOT NULL,
  Type VARCHAR(30) NOT NULL,
  Quantity INT NOT NULL,
  BeforeQuantity INT NOT NULL,
  AfterQuantity INT NOT NULL,
  ReferenceType VARCHAR(30) NULL,
  ReferenceID INT NULL,
  Note NVARCHAR(500) NULL,
  CreatedBy INT NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_InventoryTransactions_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_InventoryTransactions_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT FK_InventoryTransactions_Users FOREIGN KEY(CreatedBy) REFERENCES Users(UserID),
  CONSTRAINT CK_InventoryTransactions_Type CHECK(Type IN ('IMPORT','SALE','ADJUSTMENT','RETURN','CANCEL_RESTORE')),
  CONSTRAINT CK_InventoryTransactions_Quantity CHECK(Quantity > 0)
);
CREATE INDEX IX_InventoryTransactions_ProductID ON InventoryTransactions(ProductID);

CREATE TABLE Carts (
  CartID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Carts_Created DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Carts_Updated DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Carts_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);

CREATE TABLE CartItems (
  CartItemID INT IDENTITY(1,1) PRIMARY KEY,
  CartID INT NOT NULL,
  ProductID INT NOT NULL,
  Quantity INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_CartItems_Carts FOREIGN KEY(CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
  CONSTRAINT FK_CartItems_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT UQ_CartItems UNIQUE(CartID, ProductID),
  CONSTRAINT CK_CartItems_Quantity CHECK(Quantity > 0)
);

CREATE TABLE Wishlists (
  WishlistID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Wishlists_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Wishlists_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);

CREATE TABLE WishlistItems (
  WishlistItemID INT IDENTITY(1,1) PRIMARY KEY,
  WishlistID INT NOT NULL,
  ProductID INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_WishlistItems_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_WishlistItems_Wishlists FOREIGN KEY(WishlistID) REFERENCES Wishlists(WishlistID) ON DELETE CASCADE,
  CONSTRAINT FK_WishlistItems_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT UQ_WishlistItems UNIQUE(WishlistID, ProductID)
);

CREATE TABLE Addresses (
  AddressID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  ReceiverName NVARCHAR(120) NOT NULL,
  ReceiverPhone VARCHAR(20) NOT NULL,
  AddressLine NVARCHAR(300) NOT NULL,
  Ward NVARCHAR(120) NULL,
  District NVARCHAR(120) NULL,
  Province NVARCHAR(120) NOT NULL,
  IsDefault BIT NOT NULL CONSTRAINT DF_Addresses_Default DEFAULT 0,
  CONSTRAINT FK_Addresses_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);
CREATE INDEX IX_Addresses_UserID ON Addresses(UserID);

CREATE TABLE Coupons (
  CouponID INT IDENTITY(1,1) PRIMARY KEY,
  Code VARCHAR(40) NOT NULL UNIQUE,
  DiscountType VARCHAR(20) NOT NULL,
  DiscountValue DECIMAL(18,2) NOT NULL,
  MinOrderValue DECIMAL(18,2) NOT NULL CONSTRAINT DF_Coupons_Min DEFAULT 0,
  MaxDiscount DECIMAL(18,2) NULL,
  StartDate DATETIME2 NOT NULL,
  EndDate DATETIME2 NOT NULL,
  UsageLimit INT NULL,
  UsedCount INT NOT NULL CONSTRAINT DF_Coupons_Used DEFAULT 0,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Coupons_Status DEFAULT 'ACTIVE',
  CONSTRAINT CK_Coupons_Type CHECK(DiscountType IN ('PERCENT','FIXED')),
  CONSTRAINT CK_Coupons_Value CHECK(DiscountValue > 0 AND MinOrderValue >= 0 AND (MaxDiscount IS NULL OR MaxDiscount >= 0)),
  CONSTRAINT CK_Coupons_Dates CHECK(EndDate > StartDate),
  CONSTRAINT CK_Coupons_Usage CHECK(UsageLimit IS NULL OR UsageLimit >= 0),
  CONSTRAINT CK_Coupons_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE Orders (
  OrderID INT IDENTITY(1,1) PRIMARY KEY,
  OrderCode VARCHAR(30) NOT NULL UNIQUE,
  UserID INT NOT NULL,
  CouponID INT NULL,
  ReceiverName NVARCHAR(120) NOT NULL,
  ReceiverPhone VARCHAR(20) NOT NULL,
  ReceiverEmail VARCHAR(160) NOT NULL,
  ShippingAddress NVARCHAR(500) NOT NULL,
  Note NVARCHAR(500) NULL,
  ShippingMethod VARCHAR(30) NOT NULL CONSTRAINT DF_Orders_ShippingMethod DEFAULT 'STANDARD',
  Subtotal DECIMAL(18,2) NOT NULL,
  DiscountAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_Discount DEFAULT 0,
  ShippingFee DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_ShippingFee DEFAULT 0,
  TotalAmount DECIMAL(18,2) NOT NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'PENDING',
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_Created DEFAULT SYSDATETIME(),
  UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_Updated DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Orders_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
  CONSTRAINT FK_Orders_Coupons FOREIGN KEY(CouponID) REFERENCES Coupons(CouponID),
  CONSTRAINT CK_Orders_Status CHECK(Status IN ('PENDING','CONFIRMED','PACKING','SHIPPING','COMPLETED','CANCELLED')),
  CONSTRAINT CK_Orders_Amounts CHECK(Subtotal >= 0 AND DiscountAmount >= 0 AND ShippingFee >= 0 AND TotalAmount >= 0)
);
CREATE INDEX IX_Orders_UserID ON Orders(UserID);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);

CREATE TABLE OrderDetails (
  OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
  OrderID INT NOT NULL,
  ProductID INT NOT NULL,
  ProductName NVARCHAR(220) NOT NULL,
  SKU VARCHAR(80) NOT NULL,
  UnitPrice DECIMAL(18,2) NOT NULL,
  Quantity INT NOT NULL,
  LineTotal AS (UnitPrice * Quantity) PERSISTED,
  CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
  CONSTRAINT FK_OrderDetails_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT CK_OrderDetails_Values CHECK(UnitPrice >= 0 AND Quantity > 0)
);
CREATE INDEX IX_OrderDetails_OrderID ON OrderDetails(OrderID);

CREATE TABLE Payments (
  PaymentID INT IDENTITY(1,1) PRIMARY KEY,
  OrderID INT NOT NULL UNIQUE,
  Method VARCHAR(30) NOT NULL,
  Amount DECIMAL(18,2) NOT NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Payments_Status DEFAULT 'PENDING',
  TransactionCode VARCHAR(80) NULL,
  PaidAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Payments_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
  CONSTRAINT CK_Payments_Method CHECK(Method IN ('COD','BANK_TRANSFER','VNPAY','MOMO')),
  CONSTRAINT CK_Payments_Status CHECK(Status IN ('PENDING','PAID','FAILED','REFUNDED')),
  CONSTRAINT CK_Payments_Amount CHECK(Amount >= 0)
);

CREATE TABLE Reviews (
  ReviewID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  ProductID INT NOT NULL,
  OrderID INT NOT NULL,
  Rating TINYINT NOT NULL,
  Comment NVARCHAR(1500) NULL,
  Status VARCHAR(20) NOT NULL CONSTRAINT DF_Reviews_Status DEFAULT 'APPROVED',
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Reviews_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Reviews_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
  CONSTRAINT FK_Reviews_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT FK_Reviews_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
  CONSTRAINT CK_Reviews_Rating CHECK(Rating BETWEEN 1 AND 5),
  CONSTRAINT CK_Reviews_Status CHECK(Status IN ('PENDING','APPROVED','HIDDEN')),
  CONSTRAINT UQ_Reviews UNIQUE(UserID, ProductID, OrderID)
);

CREATE TABLE AIChatHistory (
  ChatID BIGINT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NULL,
  Message NVARCHAR(2000) NOT NULL,
  Response NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AIChatHistory_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_AIChatHistory_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);

CREATE TABLE ProductViews (
  ViewID BIGINT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NULL,
  ProductID INT NOT NULL,
  ViewedAt DATETIME2 NOT NULL CONSTRAINT DF_ProductViews_Viewed DEFAULT SYSDATETIME(),
  CONSTRAINT FK_ProductViews_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
  CONSTRAINT FK_ProductViews_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID)
);
CREATE INDEX IX_ProductViews_UserID ON ProductViews(UserID);
CREATE INDEX IX_ProductViews_ProductID ON ProductViews(ProductID);

CREATE TABLE Recommendations (
  RecommendationID BIGINT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  ProductID INT NOT NULL,
  Score DECIMAL(8,4) NOT NULL,
  Reason NVARCHAR(300) NULL,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Recommendations_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Recommendations_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
  CONSTRAINT FK_Recommendations_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
  CONSTRAINT CK_Recommendations_Score CHECK(Score >= 0)
);

CREATE TABLE Notifications (
  NotificationID BIGINT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  Title NVARCHAR(180) NOT NULL,
  Message NVARCHAR(700) NOT NULL,
  Type VARCHAR(40) NOT NULL CONSTRAINT DF_Notifications_Type DEFAULT 'SYSTEM',
  ReferenceID INT NULL,
  IsRead BIT NOT NULL CONSTRAINT DF_Notifications_Read DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_Created DEFAULT SYSDATETIME(),
  CONSTRAINT FK_Notifications_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
);
CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
GO

-- Additive migration. Does not reset or delete existing business data.
IF COL_LENGTH('dbo.Users','TokenVersion') IS NULL
 ALTER TABLE dbo.Users ADD TokenVersion INT NOT NULL CONSTRAINT DF_Users_TokenVersion DEFAULT 0;
IF COL_LENGTH('dbo.Orders','CompletedAt') IS NULL
 ALTER TABLE dbo.Orders ADD CompletedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Orders','RequestKey') IS NULL
 ALTER TABLE dbo.Orders ADD RequestKey VARCHAR(80) NULL;
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='UX_Orders_RequestKey' AND object_id=OBJECT_ID('dbo.Orders'))
 CREATE UNIQUE INDEX UX_Orders_RequestKey ON dbo.Orders(UserID,RequestKey) WHERE RequestKey IS NOT NULL;
IF OBJECT_ID('dbo.OrderStatusHistory','U') IS NULL
BEGIN
 CREATE TABLE dbo.OrderStatusHistory (
  HistoryID BIGINT IDENTITY PRIMARY KEY,
  OrderID INT NOT NULL REFERENCES dbo.Orders(OrderID),
  ChangedBy INT NULL REFERENCES dbo.Users(UserID),
  FromStatus VARCHAR(20) NULL,
  ToStatus VARCHAR(20) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
 );
 CREATE INDEX IX_OrderStatusHistory_OrderID ON dbo.OrderStatusHistory(OrderID,HistoryID);
END;
-- Historical completion time is unknown: leave NULL, reports label legacy fallback.

-- ===== MA CU TRUOC KHI SUA - KHONG THUC THI =====
-- IF DB_ID('DopTechDB') IS NULL
-- BEGIN
--     CREATE DATABASE DopTechDB;
-- END
-- GO
-- USE DopTechDB;
-- GO
-- 
-- -- Drop in dependency order for repeatable classroom demo reset.
-- IF OBJECT_ID('dbo.Recommendations','U') IS NOT NULL DROP TABLE dbo.Recommendations;
-- IF OBJECT_ID('dbo.ProductViews','U') IS NOT NULL DROP TABLE dbo.ProductViews;
-- IF OBJECT_ID('dbo.AIChatHistory','U') IS NOT NULL DROP TABLE dbo.AIChatHistory;
-- IF OBJECT_ID('dbo.Notifications','U') IS NOT NULL DROP TABLE dbo.Notifications;
-- IF OBJECT_ID('dbo.Reviews','U') IS NOT NULL DROP TABLE dbo.Reviews;
-- IF OBJECT_ID('dbo.Payments','U') IS NOT NULL DROP TABLE dbo.Payments;
-- IF OBJECT_ID('dbo.OrderDetails','U') IS NOT NULL DROP TABLE dbo.OrderDetails;
-- IF OBJECT_ID('dbo.Orders','U') IS NOT NULL DROP TABLE dbo.Orders;
-- IF OBJECT_ID('dbo.Coupons','U') IS NOT NULL DROP TABLE dbo.Coupons;
-- IF OBJECT_ID('dbo.Addresses','U') IS NOT NULL DROP TABLE dbo.Addresses;
-- IF OBJECT_ID('dbo.WishlistItems','U') IS NOT NULL DROP TABLE dbo.WishlistItems;
-- IF OBJECT_ID('dbo.Wishlists','U') IS NOT NULL DROP TABLE dbo.Wishlists;
-- IF OBJECT_ID('dbo.CartItems','U') IS NOT NULL DROP TABLE dbo.CartItems;
-- IF OBJECT_ID('dbo.Carts','U') IS NOT NULL DROP TABLE dbo.Carts;
-- IF OBJECT_ID('dbo.InventoryTransactions','U') IS NOT NULL DROP TABLE dbo.InventoryTransactions;
-- IF OBJECT_ID('dbo.Inventory','U') IS NOT NULL DROP TABLE dbo.Inventory;
-- IF OBJECT_ID('dbo.ProductSpecifications','U') IS NOT NULL DROP TABLE dbo.ProductSpecifications;
-- IF OBJECT_ID('dbo.ProductImages','U') IS NOT NULL DROP TABLE dbo.ProductImages;
-- IF OBJECT_ID('dbo.Products','U') IS NOT NULL DROP TABLE dbo.Products;
-- IF OBJECT_ID('dbo.Brands','U') IS NOT NULL DROP TABLE dbo.Brands;
-- IF OBJECT_ID('dbo.Categories','U') IS NOT NULL DROP TABLE dbo.Categories;
-- IF OBJECT_ID('dbo.Staff','U') IS NOT NULL DROP TABLE dbo.Staff;
-- IF OBJECT_ID('dbo.Customers','U') IS NOT NULL DROP TABLE dbo.Customers;
-- IF OBJECT_ID('dbo.Users','U') IS NOT NULL DROP TABLE dbo.Users;
-- IF OBJECT_ID('dbo.Roles','U') IS NOT NULL DROP TABLE dbo.Roles;
-- GO
-- 
-- CREATE TABLE Roles (
--   RoleID INT IDENTITY(1,1) PRIMARY KEY,
--   RoleName VARCHAR(20) NOT NULL UNIQUE,
--   Description NVARCHAR(255) NULL
-- );
-- 
-- CREATE TABLE Users (
--   UserID INT IDENTITY(1,1) PRIMARY KEY,
--   RoleID INT NOT NULL,
--   FullName NVARCHAR(120) NOT NULL,
--   Email VARCHAR(160) NOT NULL UNIQUE,
--   Phone VARCHAR(20) NULL,
--   PasswordHash VARCHAR(255) NOT NULL,
--   Avatar NVARCHAR(500) NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Users_Status DEFAULT 'ACTIVE',
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIME(),
--   UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Users_Roles FOREIGN KEY(RoleID) REFERENCES Roles(RoleID),
--   CONSTRAINT CK_Users_Status CHECK(Status IN ('ACTIVE','INACTIVE','LOCKED'))
-- );
-- CREATE INDEX IX_Users_RoleID ON Users(RoleID);
-- 
-- CREATE TABLE Customers (
--   CustomerID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL UNIQUE,
--   DateOfBirth DATE NULL,
--   Gender VARCHAR(10) NULL,
--   LoyaltyPoints INT NOT NULL CONSTRAINT DF_Customers_Points DEFAULT 0,
--   CONSTRAINT FK_Customers_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
--   CONSTRAINT CK_Customers_Gender CHECK(Gender IS NULL OR Gender IN ('MALE','FEMALE','OTHER')),
--   CONSTRAINT CK_Customers_Points CHECK(LoyaltyPoints >= 0)
-- );
-- 
-- CREATE TABLE Staff (
--   StaffID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL UNIQUE,
--   StaffCode VARCHAR(30) NOT NULL UNIQUE,
--   Position NVARCHAR(100) NULL,
--   HireDate DATE NULL,
--   CONSTRAINT FK_Staff_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- 
-- CREATE TABLE Categories (
--   CategoryID INT IDENTITY(1,1) PRIMARY KEY,
--   CategoryName NVARCHAR(120) NOT NULL UNIQUE,
--   Slug VARCHAR(140) NOT NULL UNIQUE,
--   Description NVARCHAR(500) NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Categories_Status DEFAULT 'ACTIVE',
--   CONSTRAINT CK_Categories_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
-- );
-- 
-- CREATE TABLE Brands (
--   BrandID INT IDENTITY(1,1) PRIMARY KEY,
--   BrandName NVARCHAR(120) NOT NULL UNIQUE,
--   Slug VARCHAR(140) NOT NULL UNIQUE,
--   LogoUrl NVARCHAR(500) NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Brands_Status DEFAULT 'ACTIVE',
--   CONSTRAINT CK_Brands_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
-- );
-- 
-- CREATE TABLE Products (
--   ProductID INT IDENTITY(1,1) PRIMARY KEY,
--   ProductName NVARCHAR(220) NOT NULL,
--   Slug VARCHAR(240) NOT NULL UNIQUE,
--   CategoryID INT NOT NULL,
--   BrandID INT NOT NULL,
--   Description NVARCHAR(MAX) NULL,
--   ShortDescription NVARCHAR(700) NULL,
--   Price DECIMAL(18,2) NOT NULL,
--   DiscountPrice DECIMAL(18,2) NULL,
--   SKU VARCHAR(80) NOT NULL UNIQUE,
--   Thumbnail NVARCHAR(500) NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Products_Status DEFAULT 'ACTIVE',
--   Featured BIT NOT NULL CONSTRAINT DF_Products_Featured DEFAULT 0,
--   SoldCount INT NOT NULL CONSTRAINT DF_Products_Sold DEFAULT 0,
--   AverageRating DECIMAL(3,2) NOT NULL CONSTRAINT DF_Products_Rating DEFAULT 0,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT SYSDATETIME(),
--   UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Products_Categories FOREIGN KEY(CategoryID) REFERENCES Categories(CategoryID),
--   CONSTRAINT FK_Products_Brands FOREIGN KEY(BrandID) REFERENCES Brands(BrandID),
--   CONSTRAINT CK_Products_Price CHECK(Price >= 0),
--   CONSTRAINT CK_Products_DiscountPrice CHECK(DiscountPrice IS NULL OR (DiscountPrice >= 0 AND DiscountPrice <= Price)),
--   CONSTRAINT CK_Products_Status CHECK(Status IN ('ACTIVE','INACTIVE','DISCONTINUED')),
--   CONSTRAINT CK_Products_Rating CHECK(AverageRating BETWEEN 0 AND 5)
-- );
-- CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);
-- CREATE INDEX IX_Products_BrandID ON Products(BrandID);
-- CREATE INDEX IX_Products_Status ON Products(Status);
-- CREATE INDEX IX_Products_Price ON Products(Price);
-- 
-- CREATE TABLE ProductImages (
--   ImageID INT IDENTITY(1,1) PRIMARY KEY,
--   ProductID INT NOT NULL,
--   ImageUrl NVARCHAR(500) NOT NULL,
--   IsPrimary BIT NOT NULL CONSTRAINT DF_ProductImages_Primary DEFAULT 0,
--   SortOrder INT NOT NULL CONSTRAINT DF_ProductImages_Sort DEFAULT 0,
--   CONSTRAINT FK_ProductImages_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID)
-- );
-- CREATE INDEX IX_ProductImages_ProductID ON ProductImages(ProductID);
-- 
-- CREATE TABLE ProductSpecifications (
--   SpecificationID INT IDENTITY(1,1) PRIMARY KEY,
--   ProductID INT NOT NULL,
--   SpecName NVARCHAR(120) NOT NULL,
--   SpecValue NVARCHAR(500) NOT NULL,
--   SortOrder INT NOT NULL CONSTRAINT DF_ProductSpecs_Sort DEFAULT 0,
--   CONSTRAINT FK_ProductSpecifications_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT UQ_ProductSpecifications UNIQUE(ProductID, SpecName)
-- );
-- 
-- CREATE TABLE Inventory (
--   InventoryID INT IDENTITY(1,1) PRIMARY KEY,
--   ProductID INT NOT NULL UNIQUE,
--   Quantity INT NOT NULL CONSTRAINT DF_Inventory_Quantity DEFAULT 0,
--   ReservedQuantity INT NOT NULL CONSTRAINT DF_Inventory_Reserved DEFAULT 0,
--   ReorderLevel INT NOT NULL CONSTRAINT DF_Inventory_Reorder DEFAULT 5,
--   UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Inventory_Updated DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Inventory_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT CK_Inventory_Quantity CHECK(Quantity >= 0 AND ReservedQuantity >= 0 AND ReorderLevel >= 0),
--   CONSTRAINT CK_Inventory_Reserved CHECK(ReservedQuantity <= Quantity)
-- );
-- 
-- CREATE TABLE InventoryTransactions (
--   TransactionID BIGINT IDENTITY(1,1) PRIMARY KEY,
--   ProductID INT NOT NULL,
--   Type VARCHAR(30) NOT NULL,
--   Quantity INT NOT NULL,
--   BeforeQuantity INT NOT NULL,
--   AfterQuantity INT NOT NULL,
--   ReferenceType VARCHAR(30) NULL,
--   ReferenceID INT NULL,
--   Note NVARCHAR(500) NULL,
--   CreatedBy INT NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_InventoryTransactions_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_InventoryTransactions_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT FK_InventoryTransactions_Users FOREIGN KEY(CreatedBy) REFERENCES Users(UserID),
--   CONSTRAINT CK_InventoryTransactions_Type CHECK(Type IN ('IMPORT','SALE','ADJUSTMENT','RETURN','CANCEL_RESTORE')),
--   CONSTRAINT CK_InventoryTransactions_Quantity CHECK(Quantity > 0)
-- );
-- CREATE INDEX IX_InventoryTransactions_ProductID ON InventoryTransactions(ProductID);
-- 
-- CREATE TABLE Carts (
--   CartID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL UNIQUE,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Carts_Created DEFAULT SYSDATETIME(),
--   UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Carts_Updated DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Carts_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- 
-- CREATE TABLE CartItems (
--   CartItemID INT IDENTITY(1,1) PRIMARY KEY,
--   CartID INT NOT NULL,
--   ProductID INT NOT NULL,
--   Quantity INT NOT NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_CartItems_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_CartItems_Carts FOREIGN KEY(CartID) REFERENCES Carts(CartID) ON DELETE CASCADE,
--   CONSTRAINT FK_CartItems_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT UQ_CartItems UNIQUE(CartID, ProductID),
--   CONSTRAINT CK_CartItems_Quantity CHECK(Quantity > 0)
-- );
-- 
-- CREATE TABLE Wishlists (
--   WishlistID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL UNIQUE,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Wishlists_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Wishlists_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- 
-- CREATE TABLE WishlistItems (
--   WishlistItemID INT IDENTITY(1,1) PRIMARY KEY,
--   WishlistID INT NOT NULL,
--   ProductID INT NOT NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_WishlistItems_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_WishlistItems_Wishlists FOREIGN KEY(WishlistID) REFERENCES Wishlists(WishlistID) ON DELETE CASCADE,
--   CONSTRAINT FK_WishlistItems_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT UQ_WishlistItems UNIQUE(WishlistID, ProductID)
-- );
-- 
-- CREATE TABLE Addresses (
--   AddressID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL,
--   ReceiverName NVARCHAR(120) NOT NULL,
--   ReceiverPhone VARCHAR(20) NOT NULL,
--   AddressLine NVARCHAR(300) NOT NULL,
--   Ward NVARCHAR(120) NULL,
--   District NVARCHAR(120) NULL,
--   Province NVARCHAR(120) NOT NULL,
--   IsDefault BIT NOT NULL CONSTRAINT DF_Addresses_Default DEFAULT 0,
--   CONSTRAINT FK_Addresses_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- CREATE INDEX IX_Addresses_UserID ON Addresses(UserID);
-- 
-- CREATE TABLE Coupons (
--   CouponID INT IDENTITY(1,1) PRIMARY KEY,
--   Code VARCHAR(40) NOT NULL UNIQUE,
--   DiscountType VARCHAR(20) NOT NULL,
--   DiscountValue DECIMAL(18,2) NOT NULL,
--   MinOrderValue DECIMAL(18,2) NOT NULL CONSTRAINT DF_Coupons_Min DEFAULT 0,
--   MaxDiscount DECIMAL(18,2) NULL,
--   StartDate DATETIME2 NOT NULL,
--   EndDate DATETIME2 NOT NULL,
--   UsageLimit INT NULL,
--   UsedCount INT NOT NULL CONSTRAINT DF_Coupons_Used DEFAULT 0,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Coupons_Status DEFAULT 'ACTIVE',
--   CONSTRAINT CK_Coupons_Type CHECK(DiscountType IN ('PERCENT','FIXED')),
--   CONSTRAINT CK_Coupons_Value CHECK(DiscountValue > 0 AND MinOrderValue >= 0 AND (MaxDiscount IS NULL OR MaxDiscount >= 0)),
--   CONSTRAINT CK_Coupons_Dates CHECK(EndDate > StartDate),
--   CONSTRAINT CK_Coupons_Usage CHECK(UsageLimit IS NULL OR UsageLimit >= 0),
--   CONSTRAINT CK_Coupons_Status CHECK(Status IN ('ACTIVE','INACTIVE'))
-- );
-- 
-- CREATE TABLE Orders (
--   OrderID INT IDENTITY(1,1) PRIMARY KEY,
--   OrderCode VARCHAR(30) NOT NULL UNIQUE,
--   UserID INT NOT NULL,
--   CouponID INT NULL,
--   ReceiverName NVARCHAR(120) NOT NULL,
--   ReceiverPhone VARCHAR(20) NOT NULL,
--   ReceiverEmail VARCHAR(160) NOT NULL,
--   ShippingAddress NVARCHAR(500) NOT NULL,
--   Note NVARCHAR(500) NULL,
--   ShippingMethod VARCHAR(30) NOT NULL CONSTRAINT DF_Orders_ShippingMethod DEFAULT 'STANDARD',
--   Subtotal DECIMAL(18,2) NOT NULL,
--   DiscountAmount DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_Discount DEFAULT 0,
--   ShippingFee DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_ShippingFee DEFAULT 0,
--   TotalAmount DECIMAL(18,2) NOT NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT 'PENDING',
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_Created DEFAULT SYSDATETIME(),
--   UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Orders_Updated DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Orders_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
--   CONSTRAINT FK_Orders_Coupons FOREIGN KEY(CouponID) REFERENCES Coupons(CouponID),
--   CONSTRAINT CK_Orders_Status CHECK(Status IN ('PENDING','CONFIRMED','PACKING','SHIPPING','COMPLETED','CANCELLED')),
--   CONSTRAINT CK_Orders_Amounts CHECK(Subtotal >= 0 AND DiscountAmount >= 0 AND ShippingFee >= 0 AND TotalAmount >= 0)
-- );
-- CREATE INDEX IX_Orders_UserID ON Orders(UserID);
-- CREATE INDEX IX_Orders_Status ON Orders(Status);
-- CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);
-- 
-- CREATE TABLE OrderDetails (
--   OrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
--   OrderID INT NOT NULL,
--   ProductID INT NOT NULL,
--   ProductName NVARCHAR(220) NOT NULL,
--   SKU VARCHAR(80) NOT NULL,
--   UnitPrice DECIMAL(18,2) NOT NULL,
--   Quantity INT NOT NULL,
--   LineTotal AS (UnitPrice * Quantity) PERSISTED,
--   CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
--   CONSTRAINT FK_OrderDetails_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT CK_OrderDetails_Values CHECK(UnitPrice >= 0 AND Quantity > 0)
-- );
-- CREATE INDEX IX_OrderDetails_OrderID ON OrderDetails(OrderID);
-- 
-- CREATE TABLE Payments (
--   PaymentID INT IDENTITY(1,1) PRIMARY KEY,
--   OrderID INT NOT NULL UNIQUE,
--   Method VARCHAR(30) NOT NULL,
--   Amount DECIMAL(18,2) NOT NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Payments_Status DEFAULT 'PENDING',
--   TransactionCode VARCHAR(80) NULL,
--   PaidAt DATETIME2 NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Payments_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Payments_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
--   CONSTRAINT CK_Payments_Method CHECK(Method IN ('COD','BANK_TRANSFER','VNPAY','MOMO')),
--   CONSTRAINT CK_Payments_Status CHECK(Status IN ('PENDING','PAID','FAILED','REFUNDED')),
--   CONSTRAINT CK_Payments_Amount CHECK(Amount >= 0)
-- );
-- 
-- CREATE TABLE Reviews (
--   ReviewID INT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL,
--   ProductID INT NOT NULL,
--   OrderID INT NOT NULL,
--   Rating TINYINT NOT NULL,
--   Comment NVARCHAR(1500) NULL,
--   Status VARCHAR(20) NOT NULL CONSTRAINT DF_Reviews_Status DEFAULT 'APPROVED',
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Reviews_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Reviews_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
--   CONSTRAINT FK_Reviews_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT FK_Reviews_Orders FOREIGN KEY(OrderID) REFERENCES Orders(OrderID),
--   CONSTRAINT CK_Reviews_Rating CHECK(Rating BETWEEN 1 AND 5),
--   CONSTRAINT CK_Reviews_Status CHECK(Status IN ('PENDING','APPROVED','HIDDEN')),
--   CONSTRAINT UQ_Reviews UNIQUE(UserID, ProductID, OrderID)
-- );
-- 
-- CREATE TABLE AIChatHistory (
--   ChatID BIGINT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NULL,
--   Message NVARCHAR(2000) NOT NULL,
--   Response NVARCHAR(MAX) NOT NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_AIChatHistory_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_AIChatHistory_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- 
-- CREATE TABLE ProductViews (
--   ViewID BIGINT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NULL,
--   ProductID INT NOT NULL,
--   ViewedAt DATETIME2 NOT NULL CONSTRAINT DF_ProductViews_Viewed DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_ProductViews_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
--   CONSTRAINT FK_ProductViews_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID)
-- );
-- CREATE INDEX IX_ProductViews_UserID ON ProductViews(UserID);
-- CREATE INDEX IX_ProductViews_ProductID ON ProductViews(ProductID);
-- 
-- CREATE TABLE Recommendations (
--   RecommendationID BIGINT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL,
--   ProductID INT NOT NULL,
--   Score DECIMAL(8,4) NOT NULL,
--   Reason NVARCHAR(300) NULL,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Recommendations_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Recommendations_Users FOREIGN KEY(UserID) REFERENCES Users(UserID),
--   CONSTRAINT FK_Recommendations_Products FOREIGN KEY(ProductID) REFERENCES Products(ProductID),
--   CONSTRAINT CK_Recommendations_Score CHECK(Score >= 0)
-- );
-- 
-- CREATE TABLE Notifications (
--   NotificationID BIGINT IDENTITY(1,1) PRIMARY KEY,
--   UserID INT NOT NULL,
--   Title NVARCHAR(180) NOT NULL,
--   Message NVARCHAR(700) NOT NULL,
--   Type VARCHAR(40) NOT NULL CONSTRAINT DF_Notifications_Type DEFAULT 'SYSTEM',
--   ReferenceID INT NULL,
--   IsRead BIT NOT NULL CONSTRAINT DF_Notifications_Read DEFAULT 0,
--   CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_Created DEFAULT SYSDATETIME(),
--   CONSTRAINT FK_Notifications_Users FOREIGN KEY(UserID) REFERENCES Users(UserID)
-- );
-- CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
-- GO
-- 
-- ===== HET MA CU =====
