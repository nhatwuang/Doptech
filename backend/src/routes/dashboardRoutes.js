const router = require('express').Router();
const {
  getPool
} = require('../config/database');
const {
  ok
} = require('../utils/apiResponse');
const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/auth');
router.use(authenticateToken, authorizeRoles('ADMIN'));
router.get('/', async (_req, res, next) => {
  try {
    const p = await getPool();
    const [cards, revenue, orders, best, cats, brands, recent, low, newCustomers] = await Promise.all([p.request().query(`SELECT (SELECT COUNT(*) FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE r.RoleName='CUSTOMER') TotalCustomers,(SELECT COUNT(*) FROM Products WHERE Status='ACTIVE') TotalProducts,(SELECT COUNT(*) FROM Orders) TotalOrders,(SELECT ISNULL(SUM(TotalAmount),0) FROM Orders WHERE Status='COMPLETED') TotalRevenue,(SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE)=CAST(GETDATE() AS DATE)) TodayOrders,(SELECT COUNT(*) FROM Inventory WHERE Quantity<=ReorderLevel) LowStock,(SELECT COUNT(*) FROM Orders WHERE Status='SHIPPING') ShippingOrders`), p.request().query(`SELECT FORMAT(COALESCE(CompletedAt,CreatedAt),'yyyy-MM') Label,SUM(TotalAmount) Value FROM Orders WHERE Status='COMPLETED' AND COALESCE(CompletedAt,CreatedAt)>=DATEADD(MONTH,-11,GETDATE()) GROUP BY FORMAT(COALESCE(CompletedAt,CreatedAt),'yyyy-MM') ORDER BY Label`), p.request().query(`SELECT FORMAT(CreatedAt,'yyyy-MM') Label,COUNT(*) Value FROM Orders WHERE CreatedAt>=DATEADD(MONTH,-11,GETDATE()) GROUP BY FORMAT(CreatedAt,'yyyy-MM') ORDER BY Label`), p.request().query(`SELECT TOP 8 p.ProductName Label,SUM(od.Quantity) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID WHERE o.Status='COMPLETED' GROUP BY p.ProductName ORDER BY Value DESC`), p.request().query(`SELECT TOP 8 c.CategoryName Label,SUM(od.LineTotal) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID JOIN Categories c ON c.CategoryID=p.CategoryID WHERE o.Status='COMPLETED' GROUP BY c.CategoryName ORDER BY Value DESC`), p.request().query(`SELECT TOP 8 b.BrandName Label,SUM(od.LineTotal) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID JOIN Brands b ON b.BrandID=p.BrandID WHERE o.Status='COMPLETED' GROUP BY b.BrandName ORDER BY Value DESC`), p.request().query(`SELECT TOP 8 o.OrderID,o.OrderCode,o.TotalAmount,o.Status,o.CreatedAt,u.FullName FROM Orders o JOIN Users u ON u.UserID=o.UserID ORDER BY o.CreatedAt DESC`), p.request().query(`SELECT TOP 8 p.ProductID,p.ProductName,p.SKU,i.Quantity,i.ReorderLevel FROM Inventory i JOIN Products p ON p.ProductID=i.ProductID WHERE i.Quantity<=i.ReorderLevel ORDER BY i.Quantity`), p.request().query(`SELECT TOP 8 u.UserID,u.FullName,u.Email,u.CreatedAt FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE r.RoleName='CUSTOMER' ORDER BY u.CreatedAt DESC`)]);
    return ok(res, {
      cards: cards.recordset[0],
      charts: {
        revenue: revenue.recordset,
        orders: orders.recordset,
        bestSelling: best.recordset,
        categoryRevenue: cats.recordset,
        brandRevenue: brands.recordset
      },
      tables: {
        recentOrders: recent.recordset,
        lowStock: low.recordset,
        newCustomers: newCustomers.recordset
      }
    });
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const {getPool}=require('../config/database');const {ok}=require('../utils/apiResponse');const {authenticateToken,authorizeRoles}=require('../middleware/auth');router.use(authenticateToken,authorizeRoles('ADMIN','STAFF'));
// router.get('/',async(_req,res,next)=>{try{const p=await getPool();const [cards,revenue,orders,best,cats,brands,recent,low,newCustomers]=await Promise.all([
//  p.request().query(`SELECT (SELECT COUNT(*) FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE r.RoleName='CUSTOMER') TotalCustomers,(SELECT COUNT(*) FROM Products WHERE Status='ACTIVE') TotalProducts,(SELECT COUNT(*) FROM Orders) TotalOrders,(SELECT ISNULL(SUM(TotalAmount),0) FROM Orders WHERE Status='COMPLETED') TotalRevenue,(SELECT COUNT(*) FROM Orders WHERE CAST(CreatedAt AS DATE)=CAST(GETDATE() AS DATE)) TodayOrders,(SELECT COUNT(*) FROM Inventory WHERE Quantity<=ReorderLevel) LowStock,(SELECT COUNT(*) FROM Orders WHERE Status='SHIPPING') ShippingOrders`),
//  p.request().query(`SELECT FORMAT(CreatedAt,'yyyy-MM') Label,SUM(TotalAmount) Value FROM Orders WHERE Status='COMPLETED' AND CreatedAt>=DATEADD(MONTH,-11,GETDATE()) GROUP BY FORMAT(CreatedAt,'yyyy-MM') ORDER BY Label`),
//  p.request().query(`SELECT FORMAT(CreatedAt,'yyyy-MM') Label,COUNT(*) Value FROM Orders WHERE CreatedAt>=DATEADD(MONTH,-11,GETDATE()) GROUP BY FORMAT(CreatedAt,'yyyy-MM') ORDER BY Label`),
//  p.request().query(`SELECT TOP 8 p.ProductName Label,SUM(od.Quantity) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID WHERE o.Status<>'CANCELLED' GROUP BY p.ProductName ORDER BY Value DESC`),
//  p.request().query(`SELECT TOP 8 c.CategoryName Label,SUM(od.LineTotal) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID JOIN Categories c ON c.CategoryID=p.CategoryID WHERE o.Status='COMPLETED' GROUP BY c.CategoryName ORDER BY Value DESC`),
//  p.request().query(`SELECT TOP 8 b.BrandName Label,SUM(od.LineTotal) Value FROM OrderDetails od JOIN Orders o ON o.OrderID=od.OrderID JOIN Products p ON p.ProductID=od.ProductID JOIN Brands b ON b.BrandID=p.BrandID WHERE o.Status='COMPLETED' GROUP BY b.BrandName ORDER BY Value DESC`),
//  p.request().query(`SELECT TOP 8 o.OrderID,o.OrderCode,o.TotalAmount,o.Status,o.CreatedAt,u.FullName FROM Orders o JOIN Users u ON u.UserID=o.UserID ORDER BY o.CreatedAt DESC`),
//  p.request().query(`SELECT TOP 8 p.ProductID,p.ProductName,p.SKU,i.Quantity,i.ReorderLevel FROM Inventory i JOIN Products p ON p.ProductID=i.ProductID WHERE i.Quantity<=i.ReorderLevel ORDER BY i.Quantity`),
//  p.request().query(`SELECT TOP 8 u.UserID,u.FullName,u.Email,u.CreatedAt FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE r.RoleName='CUSTOMER' ORDER BY u.CreatedAt DESC`)
// ]);return ok(res,{cards:cards.recordset[0],charts:{revenue:revenue.recordset,orders:orders.recordset,bestSelling:best.recordset,categoryRevenue:cats.recordset,brandRevenue:brands.recordset},tables:{recentOrders:recent.recordset,lowStock:low.recordset,newCustomers:newCustomers.recordset}})}catch(e){next(e)}});module.exports=router;
// 
// ===== HET MA CU =====
