const router = require("express").Router();
const slugify = require("slugify");
const {
  sql,
  getPool
} = require("../config/database");
const {
  ok,
  fail
} = require("../utils/apiResponse");
const {
  authenticateToken,
  authorizeRoles
} = require("../middleware/auth");
router.use(authenticateToken);
router.use(require('./managementRoutes'));
router.get("/orders", authorizeRoles("ADMIN", "STAFF"), async (req, res, next) => {
  try {
    const p = await getPool();
    const rq = p.request();
    const where = [];
    if (req.query.status) {
      where.push("o.Status=@status");
      rq.input("status", sql.VarChar(20), req.query.status);
    }
    if (req.query.search) {
      where.push("(o.OrderCode LIKE @s OR u.FullName LIKE @s OR u.Email LIKE @s)");
      rq.input("s", sql.NVarChar(180), `%${req.query.search}%`);
    }
    const q = `SELECT o.OrderID,o.OrderCode,o.TotalAmount,o.Status,o.CreatedAt,o.UpdatedAt,u.FullName,u.Email,pay.Method PaymentMethod,pay.Status PaymentStatus FROM Orders o JOIN Users u ON u.UserID=o.UserID LEFT JOIN Payments pay ON pay.OrderID=o.OrderID ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY o.CreatedAt DESC`;
    return ok(res, (await rq.query(q)).recordset);
  } catch (e) {
    next(e);
  }
});
router.put('/orders/:id/status', authorizeRoles('ADMIN', 'STAFF'), async (req, res, next) => {
  try {
    return ok(res, await require('../services/orderLifecycle').change(req.user, req.params.id, String(req.body.status || '').toUpperCase()), 'Đã cập nhật đơn hàng');
  } catch (e) {
    next(e);
  }
});
router.get("/products", authorizeRoles("ADMIN", "STAFF"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query(`SELECT p.ProductID,p.ProductName,p.Slug,p.SKU,p.Price,p.DiscountPrice,p.Status,p.Featured,c.CategoryName,b.BrandName,i.Quantity StockQuantity FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID ORDER BY p.ProductID DESC`)).recordset);
  } catch (e) {
    next(e);
  }
});
router.delete("/products/:id", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = await getPool();
    await p.request().input("id", sql.Int, Number(req.params.id)).query(`UPDATE Products SET Status='INACTIVE',UpdatedAt=SYSDATETIME() WHERE ProductID=@id`);
    return ok(res, null, "Đã vô hiệu hóa sản phẩm");
  } catch (e) {
    next(e);
  }
});
router.get("/customers", authorizeRoles("ADMIN", "STAFF"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query(`SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Status,u.CreatedAt,c.LoyaltyPoints,(SELECT COUNT(*) FROM Orders o WHERE o.UserID=u.UserID) OrderCount FROM Users u JOIN Roles r ON r.RoleID=u.RoleID LEFT JOIN Customers c ON c.UserID=u.UserID WHERE r.RoleName='CUSTOMER' ORDER BY u.CreatedAt DESC`)).recordset);
  } catch (e) {
    next(e);
  }
});
router.get("/coupons", authorizeRoles("ADMIN"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query("SELECT * FROM Coupons ORDER BY CouponID DESC")).recordset);
  } catch (e) {
    next(e);
  }
});
router.post("/coupons", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const x = req.body,
      p = await getPool();
    const r = await p.request().input("code", sql.VarChar(40), String(x.code || "").toUpperCase()).input("t", sql.VarChar(20), x.discountType).input("v", sql.Decimal(18, 2), Number(x.discountValue)).input("min", sql.Decimal(18, 2), Number(x.minOrderValue || 0)).input("max", sql.Decimal(18, 2), x.maxDiscount ? Number(x.maxDiscount) : null).input("start", sql.DateTime2, new Date(x.startDate)).input("end", sql.DateTime2, new Date(x.endDate)).input("lim", sql.Int, x.usageLimit ? Number(x.usageLimit) : null).query(`INSERT INTO Coupons(Code,DiscountType,DiscountValue,MinOrderValue,MaxDiscount,StartDate,EndDate,UsageLimit) OUTPUT INSERTED.* VALUES(@code,@t,@v,@min,@max,@start,@end,@lim)`);
    return ok(res, r.recordset[0], "Tạo voucher thành công", 201);
  } catch (e) {
    if (e.number === 2601 || e.number === 2627) return fail(res, "Mã voucher đã tồn tại", 409);
    next(e);
  }
});
router.get("/reviews", authorizeRoles("ADMIN", "STAFF"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query(`SELECT r.*,u.FullName,p.ProductName FROM Reviews r JOIN Users u ON u.UserID=r.UserID JOIN Products p ON p.ProductID=r.ProductID ORDER BY r.CreatedAt DESC`)).recordset);
  } catch (e) {
    next(e);
  }
});
router.put('/reviews/:id/status', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    await require('../services/reviewService').moderate(req.params.id, req.body.status);
    return ok(res, null, 'Đã cập nhật đánh giá');
  } catch (e) {
    next(e);
  }
});
router.get("/reports", authorizeRoles("ADMIN"), async (_req, res, next) => {
  try {
    const p = await getPool();
    const [day, month, year, aov] = await Promise.all([p.request().query(`SELECT CAST(COALESCE(CompletedAt,CreatedAt) AS DATE) Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY CAST(COALESCE(CompletedAt,CreatedAt) AS DATE) ORDER BY Label DESC`), p.request().query(`SELECT FORMAT(COALESCE(CompletedAt,CreatedAt),'yyyy-MM') Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY FORMAT(COALESCE(CompletedAt,CreatedAt),'yyyy-MM') ORDER BY Label DESC`), p.request().query(`SELECT YEAR(COALESCE(CompletedAt,CreatedAt)) Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY YEAR(COALESCE(CompletedAt,CreatedAt)) ORDER BY Label DESC`), p.request().query(`SELECT ISNULL(AVG(CAST(TotalAmount AS DECIMAL(18,2))),0) AverageOrderValue FROM Orders WHERE Status='COMPLETED'`)]);
    return ok(res, {
      daily: day.recordset,
      monthly: month.recordset,
      yearly: year.recordset,
      averageOrderValue: aov.recordset[0].AverageOrderValue,
      basis: 'Đơn hoàn thành, tổng tiền sau giảm giá gồm vận chuyển. Đơn cũ thiếu ngày hoàn thành dùng ngày tạo.'
    });
  } catch (e) {
    next(e);
  }
});
router.get("/categories", authorizeRoles("ADMIN"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query("SELECT * FROM Categories ORDER BY CategoryID DESC")).recordset);
  } catch (e) {
    next(e);
  }
});
router.post("/categories", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const name = String(req.body.categoryName || "").trim();
    if (!name) return fail(res, "Tên danh mục không được trống", 400);
    const slug = slugify(req.body.slug || name, {
      lower: true,
      strict: true,
      locale: "vi"
    });
    const p = await getPool();
    const r = await p.request().input("n", sql.NVarChar(120), name).input("s", sql.VarChar(140), slug).input("d", sql.NVarChar(500), req.body.description || null).query("INSERT INTO Categories(CategoryName,Slug,Description) OUTPUT INSERTED.* VALUES(@n,@s,@d)");
    return ok(res, r.recordset[0], "Tạo danh mục thành công", 201);
  } catch (e) {
    if (e.number === 2601 || e.number === 2627) return fail(res, "Tên hoặc slug đã tồn tại", 409);
    next(e);
  }
});
router.put("/categories/:id/status", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = await getPool();
    const s = String(req.body.status || "INACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(s)) return fail(res, "Trạng thái không hợp lệ", 400);
    await p.request().input("id", sql.Int, Number(req.params.id)).input("s", sql.VarChar(20), s).query("UPDATE Categories SET Status=@s WHERE CategoryID=@id");
    return ok(res, null, "Cập nhật danh mục thành công");
  } catch (e) {
    next(e);
  }
});
router.get("/brands", authorizeRoles("ADMIN"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query("SELECT * FROM Brands ORDER BY BrandID DESC")).recordset);
  } catch (e) {
    next(e);
  }
});
router.post("/brands", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const name = String(req.body.brandName || "").trim();
    if (!name) return fail(res, "Tên thương hiệu không được trống", 400);
    const slug = slugify(req.body.slug || name, {
      lower: true,
      strict: true,
      locale: "vi"
    });
    const p = await getPool();
    const r = await p.request().input("n", sql.NVarChar(120), name).input("s", sql.VarChar(140), slug).query("INSERT INTO Brands(BrandName,Slug) OUTPUT INSERTED.* VALUES(@n,@s)");
    return ok(res, r.recordset[0], "Tạo thương hiệu thành công", 201);
  } catch (e) {
    if (e.number === 2601 || e.number === 2627) return fail(res, "Tên hoặc slug đã tồn tại", 409);
    next(e);
  }
});
router.put("/brands/:id/status", authorizeRoles("ADMIN"), async (req, res, next) => {
  try {
    const p = await getPool();
    const s = String(req.body.status || "INACTIVE").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(s)) return fail(res, "Trạng thái không hợp lệ", 400);
    await p.request().input("id", sql.Int, Number(req.params.id)).input("s", sql.VarChar(20), s).query("UPDATE Brands SET Status=@s WHERE BrandID=@id");
    return ok(res, null, "Cập nhật thương hiệu thành công");
  } catch (e) {
    next(e);
  }
});
router.get("/roles", authorizeRoles("ADMIN"), async (_req, res, next) => {
  try {
    const p = await getPool();
    return ok(res, (await p.request().query("SELECT RoleID,RoleName,Description FROM Roles ORDER BY RoleID")).recordset);
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router = require("express").Router();
// const slugify = require("slugify");
// const { sql, getPool } = require("../config/database");
// const { ok, fail } = require("../utils/apiResponse");
// const { authenticateToken, authorizeRoles } = require("../middleware/auth");
// router.use(authenticateToken);
// 
// router.get(
//   "/orders",
//   authorizeRoles("ADMIN", "STAFF"),
//   async (req, res, next) => {
//     try {
//       const p = await getPool();
//       const rq = p.request();
//       const where = [];
//       if (req.query.status) {
//         where.push("o.Status=@status");
//         rq.input("status", sql.VarChar(20), req.query.status);
//       }
//       if (req.query.search) {
//         where.push(
//           "(o.OrderCode LIKE @s OR u.FullName LIKE @s OR u.Email LIKE @s)",
//         );
//         rq.input("s", sql.NVarChar(180), `%${req.query.search}%`);
//       }
//       const q = `SELECT o.OrderID,o.OrderCode,o.TotalAmount,o.Status,o.CreatedAt,o.UpdatedAt,u.FullName,u.Email,pay.Method PaymentMethod,pay.Status PaymentStatus FROM Orders o JOIN Users u ON u.UserID=o.UserID LEFT JOIN Payments pay ON pay.OrderID=o.OrderID ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY o.CreatedAt DESC`;
//       return ok(res, (await rq.query(q)).recordset);
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.put(
//   "/orders/:id/status",
//   authorizeRoles("ADMIN", "STAFF"),
//   async (req, res, next) => {
//     try {
//       const status = String(req.body.status || "").toUpperCase();
//       if (
//         ![
//           "PENDING",
//           "CONFIRMED",
//           "PACKING",
//           "SHIPPING",
//           "COMPLETED",
//           "CANCELLED",
//         ].includes(status)
//       )
//         return fail(res, "Trạng thái không hợp lệ", 400);
//       const p = await getPool();
//       const current = (
//         await p
//           .request()
//           .input("o", sql.Int, Number(req.params.id))
//           .query("SELECT UserID,Status FROM Orders WHERE OrderID=@o")
//       ).recordset[0];
//       if (!current) return fail(res, "Không tìm thấy đơn hàng", 404);
//       if (current.Status === "CANCELLED" || current.Status === "COMPLETED")
//         return fail(res, "Đơn đã kết thúc, không thể đổi trạng thái", 400);
//       if (status === "CANCELLED")
//         return fail(
//           res,
//           "Hủy đơn từ màn quản trị chưa hỗ trợ hoàn kho; hãy dùng luồng hủy nghiệp vụ",
//           400,
//         );
//       const nextStatus = {
//         PENDING: "CONFIRMED",
//         CONFIRMED: "PACKING",
//         PACKING: "SHIPPING",
//         SHIPPING: "COMPLETED",
//       }[current.Status];
//       if (status !== current.Status && status !== nextStatus)
//         return fail(
//           res,
//           `Trạng thái tiếp theo hợp lệ là ${nextStatus || current.Status}`,
//           400,
//         );
//       await p
//         .request()
//         .input("o", sql.Int, Number(req.params.id))
//         .input("s", sql.VarChar(20), status)
//         .query(
//           `UPDATE Orders SET Status=@s,UpdatedAt=SYSDATETIME() WHERE OrderID=@o; UPDATE Payments SET Status=CASE WHEN @s='COMPLETED' AND Method='COD' THEN 'PAID' ELSE Status END,PaidAt=CASE WHEN @s='COMPLETED' AND Method='COD' THEN SYSDATETIME() ELSE PaidAt END WHERE OrderID=@o`,
//         );
//       await p
//         .request()
//         .input("u", sql.Int, current.UserID)
//         .input("o", sql.Int, Number(req.params.id))
//         .input("s", sql.NVarChar(100), status)
//         .query(
//           `INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Cập nhật đơn hàng',N'Đơn hàng đã chuyển sang trạng thái: '+@s,'ORDER',@o)`,
//         );
//       return ok(res, null, "Cập nhật trạng thái thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// 
// router.get(
//   "/products",
//   authorizeRoles("ADMIN", "STAFF"),
//   async (_req, res, next) => {
//     try {
//       const p = await getPool();
//       return ok(
//         res,
//         (
//           await p
//             .request()
//             .query(
//               `SELECT p.ProductID,p.ProductName,p.Slug,p.SKU,p.Price,p.DiscountPrice,p.Status,p.Featured,c.CategoryName,b.BrandName,i.Quantity StockQuantity FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID ORDER BY p.ProductID DESC`,
//             )
//         ).recordset,
//       );
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.post("/products", authorizeRoles("ADMIN"), async (req, res, next) => {
//   let tx;
//   try {
//     const x = req.body;
//     if (!x.productName || !x.categoryID || !x.brandID || !x.price || !x.sku)
//       return fail(res, "Thiếu thông tin sản phẩm", 400);
//     const p = await getPool();
//     tx = new sql.Transaction(p);
//     await tx.begin();
//     let slug = slugify(x.productName, {
//       lower: true,
//       strict: true,
//       locale: "vi",
//     });
//     const exists = (
//       await new sql.Request(tx)
//         .input("s", sql.VarChar(240), slug)
//         .query("SELECT 1 x FROM Products WHERE Slug=@s")
//     ).recordset[0];
//     if (exists) slug = `${slug}-${Date.now().toString().slice(-6)}`;
//     const r = await new sql.Request(tx)
//       .input("n", sql.NVarChar(220), x.productName)
//       .input("slug", sql.VarChar(240), slug)
//       .input("c", sql.Int, Number(x.categoryID))
//       .input("b", sql.Int, Number(x.brandID))
//       .input("d", sql.NVarChar(sql.MAX), x.description || null)
//       .input("sd", sql.NVarChar(700), x.shortDescription || null)
//       .input("price", sql.Decimal(18, 2), Number(x.price))
//       .input(
//         "dp",
//         sql.Decimal(18, 2),
//         x.discountPrice ? Number(x.discountPrice) : null,
//       )
//       .input("sku", sql.VarChar(80), x.sku)
//       .input("img", sql.NVarChar(500), x.thumbnail || null)
//       .input("f", sql.Bit, !!x.featured)
//       .query(
//         `INSERT INTO Products(ProductName,Slug,CategoryID,BrandID,Description,ShortDescription,Price,DiscountPrice,SKU,Thumbnail,Featured) OUTPUT INSERTED.ProductID VALUES(@n,@slug,@c,@b,@d,@sd,@price,@dp,@sku,@img,@f)`,
//       );
//     const id = r.recordset[0].ProductID;
//     await new sql.Request(tx)
//       .input("p", sql.Int, id)
//       .input("q", sql.Int, Math.max(0, Number(x.stock || 0)))
//       .query("INSERT INTO Inventory(ProductID,Quantity) VALUES(@p,@q)");
//     if (Array.isArray(x.specifications)) {
//       for (const [i, s] of x.specifications.entries())
//         if (s.name && s.value)
//           await new sql.Request(tx)
//             .input("p", sql.Int, id)
//             .input("n", sql.NVarChar(120), s.name)
//             .input("v", sql.NVarChar(500), s.value)
//             .input("o", sql.Int, i)
//             .query(
//               "INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder) VALUES(@p,@n,@v,@o)",
//             );
//     }
//     await tx.commit();
//     return ok(res, { productID: id, slug }, "Tạo sản phẩm thành công", 201);
//   } catch (e) {
//     if (tx)
//       try {
//         await tx.rollback();
//       } catch (_) {}
//     if (e.number === 2601 || e.number === 2627)
//       return fail(res, "SKU hoặc slug đã tồn tại", 409);
//     next(e);
//   }
// });
// router.put("/products/:id", authorizeRoles("ADMIN"), async (req, res, next) => {
//   try {
//     const p = await getPool(),
//       x = req.body;
//     await p
//       .request()
//       .input("id", sql.Int, Number(req.params.id))
//       .input("n", sql.NVarChar(220), x.productName || null)
//       .input("c", sql.Int, x.categoryID ? Number(x.categoryID) : null)
//       .input("b", sql.Int, x.brandID ? Number(x.brandID) : null)
//       .input(
//         "price",
//         sql.Decimal(18, 2),
//         x.price != null ? Number(x.price) : null,
//       )
//       .input(
//         "dp",
//         sql.Decimal(18, 2),
//         x.discountPrice === ""
//           ? null
//           : x.discountPrice != null
//             ? Number(x.discountPrice)
//             : null,
//       )
//       .input(
//         "dpSet",
//         sql.Bit,
//         Object.prototype.hasOwnProperty.call(x, "discountPrice"),
//       )
//       .input("status", sql.VarChar(20), x.status || null)
//       .input("f", sql.Bit, x.featured == null ? null : !!x.featured)
//       .input("img", sql.NVarChar(500), x.thumbnail || null)
//       .input("d", sql.NVarChar(sql.MAX), x.description || null)
//       .query(
//         `UPDATE Products SET ProductName=COALESCE(@n,ProductName),CategoryID=COALESCE(@c,CategoryID),BrandID=COALESCE(@b,BrandID),Price=COALESCE(@price,Price),DiscountPrice=CASE WHEN @dpSet=1 THEN @dp ELSE DiscountPrice END,Status=COALESCE(@status,Status),Featured=COALESCE(@f,Featured),Thumbnail=COALESCE(@img,Thumbnail),Description=COALESCE(@d,Description),UpdatedAt=SYSDATETIME() WHERE ProductID=@id`,
//       );
//     return ok(res, null, "Cập nhật sản phẩm thành công");
//   } catch (e) {
//     next(e);
//   }
// });
// router.delete(
//   "/products/:id",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const p = await getPool();
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .query(
//           `UPDATE Products SET Status='INACTIVE',UpdatedAt=SYSDATETIME() WHERE ProductID=@id`,
//         );
//       return ok(res, null, "Đã vô hiệu hóa sản phẩm");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// 
// router.get(
//   "/customers",
//   authorizeRoles("ADMIN", "STAFF"),
//   async (_req, res, next) => {
//     try {
//       const p = await getPool();
//       return ok(
//         res,
//         (
//           await p
//             .request()
//             .query(
//               `SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Status,u.CreatedAt,c.LoyaltyPoints,(SELECT COUNT(*) FROM Orders o WHERE o.UserID=u.UserID) OrderCount FROM Users u JOIN Roles r ON r.RoleID=u.RoleID LEFT JOIN Customers c ON c.UserID=u.UserID WHERE r.RoleName='CUSTOMER' ORDER BY u.CreatedAt DESC`,
//             )
//         ).recordset,
//       );
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.get("/staff", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     return ok(
//       res,
//       (
//         await p
//           .request()
//           .query(
//             `SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Status,s.StaffCode,s.Position,s.HireDate FROM Users u JOIN Staff s ON s.UserID=u.UserID ORDER BY s.StaffID`,
//           )
//       ).recordset,
//     );
//   } catch (e) {
//     next(e);
//   }
// });
// 
// router.get("/coupons", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     return ok(
//       res,
//       (await p.request().query("SELECT * FROM Coupons ORDER BY CouponID DESC"))
//         .recordset,
//     );
//   } catch (e) {
//     next(e);
//   }
// });
// router.post("/coupons", authorizeRoles("ADMIN"), async (req, res, next) => {
//   try {
//     const x = req.body,
//       p = await getPool();
//     const r = await p
//       .request()
//       .input("code", sql.VarChar(40), String(x.code || "").toUpperCase())
//       .input("t", sql.VarChar(20), x.discountType)
//       .input("v", sql.Decimal(18, 2), Number(x.discountValue))
//       .input("min", sql.Decimal(18, 2), Number(x.minOrderValue || 0))
//       .input(
//         "max",
//         sql.Decimal(18, 2),
//         x.maxDiscount ? Number(x.maxDiscount) : null,
//       )
//       .input("start", sql.DateTime2, new Date(x.startDate))
//       .input("end", sql.DateTime2, new Date(x.endDate))
//       .input("lim", sql.Int, x.usageLimit ? Number(x.usageLimit) : null)
//       .query(
//         `INSERT INTO Coupons(Code,DiscountType,DiscountValue,MinOrderValue,MaxDiscount,StartDate,EndDate,UsageLimit) OUTPUT INSERTED.* VALUES(@code,@t,@v,@min,@max,@start,@end,@lim)`,
//       );
//     return ok(res, r.recordset[0], "Tạo voucher thành công", 201);
//   } catch (e) {
//     if (e.number === 2601 || e.number === 2627)
//       return fail(res, "Mã voucher đã tồn tại", 409);
//     next(e);
//   }
// });
// router.get(
//   "/reviews",
//   authorizeRoles("ADMIN", "STAFF"),
//   async (_req, res, next) => {
//     try {
//       const p = await getPool();
//       return ok(
//         res,
//         (
//           await p
//             .request()
//             .query(
//               `SELECT r.*,u.FullName,p.ProductName FROM Reviews r JOIN Users u ON u.UserID=r.UserID JOIN Products p ON p.ProductID=r.ProductID ORDER BY r.CreatedAt DESC`,
//             )
//         ).recordset,
//       );
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.put(
//   "/reviews/:id/status",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const s = String(req.body.status || "").toUpperCase();
//       if (!["PENDING", "APPROVED", "HIDDEN"].includes(s))
//         return fail(res, "Trạng thái review không hợp lệ", 400);
//       const p = await getPool();
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .input("s", sql.VarChar(20), s)
//         .query("UPDATE Reviews SET Status=@s WHERE ReviewID=@id");
//       return ok(res, null, "Cập nhật review thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// 
// router.get("/reports", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     const [day, month, year, aov] = await Promise.all([
//       p
//         .request()
//         .query(
//           `SELECT CAST(CreatedAt AS DATE) Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY CAST(CreatedAt AS DATE) ORDER BY Label DESC`,
//         ),
//       p
//         .request()
//         .query(
//           `SELECT FORMAT(CreatedAt,'yyyy-MM') Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY FORMAT(CreatedAt,'yyyy-MM') ORDER BY Label DESC`,
//         ),
//       p
//         .request()
//         .query(
//           `SELECT YEAR(CreatedAt) Label,SUM(TotalAmount) Revenue FROM Orders WHERE Status='COMPLETED' GROUP BY YEAR(CreatedAt) ORDER BY Label DESC`,
//         ),
//       p
//         .request()
//         .query(
//           `SELECT ISNULL(AVG(CAST(TotalAmount AS DECIMAL(18,2))),0) AverageOrderValue FROM Orders WHERE Status<>'CANCELLED'`,
//         ),
//     ]);
//     return ok(res, {
//       daily: day.recordset,
//       monthly: month.recordset,
//       yearly: year.recordset,
//       averageOrderValue: aov.recordset[0].AverageOrderValue,
//     });
//   } catch (e) {
//     next(e);
//   }
// });
// 
// router.get("/categories", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     return ok(
//       res,
//       (
//         await p
//           .request()
//           .query("SELECT * FROM Categories ORDER BY CategoryID DESC")
//       ).recordset,
//     );
//   } catch (e) {
//     next(e);
//   }
// });
// router.post("/categories", authorizeRoles("ADMIN"), async (req, res, next) => {
//   try {
//     const name = String(req.body.categoryName || "").trim();
//     if (!name) return fail(res, "Tên danh mục không được trống", 400);
//     const slug = slugify(req.body.slug || name, {
//       lower: true,
//       strict: true,
//       locale: "vi",
//     });
//     const p = await getPool();
//     const r = await p
//       .request()
//       .input("n", sql.NVarChar(120), name)
//       .input("s", sql.VarChar(140), slug)
//       .input("d", sql.NVarChar(500), req.body.description || null)
//       .query(
//         "INSERT INTO Categories(CategoryName,Slug,Description) OUTPUT INSERTED.* VALUES(@n,@s,@d)",
//       );
//     return ok(res, r.recordset[0], "Tạo danh mục thành công", 201);
//   } catch (e) {
//     if (e.number === 2601 || e.number === 2627)
//       return fail(res, "Tên hoặc slug đã tồn tại", 409);
//     next(e);
//   }
// });
// router.put(
//   "/categories/:id/status",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const p = await getPool();
//       const s = String(req.body.status || "INACTIVE").toUpperCase();
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .input("s", sql.VarChar(20), s)
//         .query("UPDATE Categories SET Status=@s WHERE CategoryID=@id");
//       return ok(res, null, "Cập nhật danh mục thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.get("/brands", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     return ok(
//       res,
//       (await p.request().query("SELECT * FROM Brands ORDER BY BrandID DESC"))
//         .recordset,
//     );
//   } catch (e) {
//     next(e);
//   }
// });
// router.post("/brands", authorizeRoles("ADMIN"), async (req, res, next) => {
//   try {
//     const name = String(req.body.brandName || "").trim();
//     if (!name) return fail(res, "Tên thương hiệu không được trống", 400);
//     const slug = slugify(req.body.slug || name, {
//       lower: true,
//       strict: true,
//       locale: "vi",
//     });
//     const p = await getPool();
//     const r = await p
//       .request()
//       .input("n", sql.NVarChar(120), name)
//       .input("s", sql.VarChar(140), slug)
//       .query(
//         "INSERT INTO Brands(BrandName,Slug) OUTPUT INSERTED.* VALUES(@n,@s)",
//       );
//     return ok(res, r.recordset[0], "Tạo thương hiệu thành công", 201);
//   } catch (e) {
//     if (e.number === 2601 || e.number === 2627)
//       return fail(res, "Tên hoặc slug đã tồn tại", 409);
//     next(e);
//   }
// });
// router.put(
//   "/brands/:id/status",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const p = await getPool();
//       const s = String(req.body.status || "INACTIVE").toUpperCase();
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .input("s", sql.VarChar(20), s)
//         .query("UPDATE Brands SET Status=@s WHERE BrandID=@id");
//       return ok(res, null, "Cập nhật thương hiệu thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// router.put(
//   "/users/:id/status",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const s = String(req.body.status || "INACTIVE").toUpperCase();
//       if (!["ACTIVE", "INACTIVE", "LOCKED"].includes(s))
//         return fail(res, "Trạng thái tài khoản không hợp lệ", 400);
//       const p = await getPool();
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .input("s", sql.VarChar(20), s)
//         .query(
//           "UPDATE Users SET Status=@s,UpdatedAt=SYSDATETIME() WHERE UserID=@id",
//         );
//       return ok(res, null, "Cập nhật tài khoản thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// 
// router.get("/roles", authorizeRoles("ADMIN"), async (_req, res, next) => {
//   try {
//     const p = await getPool();
//     return ok(
//       res,
//       (
//         await p
//           .request()
//           .query(
//             "SELECT RoleID,RoleName,Description FROM Roles ORDER BY RoleID",
//           )
//       ).recordset,
//     );
//   } catch (e) {
//     next(e);
//   }
// });
// router.put(
//   "/users/:id/role",
//   authorizeRoles("ADMIN"),
//   async (req, res, next) => {
//     try {
//       const role = String(req.body.role || "").toUpperCase();
//       if (!["ADMIN", "STAFF", "CUSTOMER"].includes(role))
//         return fail(res, "Role không hợp lệ", 400);
//       const p = await getPool();
//       const rid = (
//         await p
//           .request()
//           .input("r", sql.VarChar(20), role)
//           .query("SELECT RoleID FROM Roles WHERE RoleName=@r")
//       ).recordset[0]?.RoleID;
//       if (!rid) return fail(res, "Role không tồn tại", 404);
//       await p
//         .request()
//         .input("id", sql.Int, Number(req.params.id))
//         .input("r", sql.Int, rid)
//         .query(
//           "UPDATE Users SET RoleID=@r,UpdatedAt=SYSDATETIME() WHERE UserID=@id",
//         );
//       return ok(res, null, "Cập nhật phân quyền thành công");
//     } catch (e) {
//       next(e);
//     }
//   },
// );
// 
// module.exports = router;
// 
// ===== HET MA CU =====
