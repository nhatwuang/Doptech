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
GO