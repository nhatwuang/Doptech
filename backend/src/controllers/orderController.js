const orderService = require("../services/orderService");
const {
  sql,
  getPool
} = require("../config/database");
const {
  ok,
  fail
} = require("../utils/apiResponse");
exports.checkout = async (req, res, next) => {
  try {
    if (!req.body.shippingAddress) return fail(res, "Vui lòng nhập địa chỉ nhận hàng", 400);
    return ok(res, await orderService.checkout(req.user.userID, req.body), "Đặt hàng thành công", 201);
  } catch (e) {
    next(e);
  }
};
exports.mine = async (req, res, next) => {
  try {
    const p = await getPool();
    const r = await p.request().input("u", sql.Int, req.user.userID).query(`SELECT o.*,p.Method PaymentMethod,p.Status PaymentStatus FROM Orders o LEFT JOIN Payments p ON p.OrderID=o.OrderID WHERE o.UserID=@u ORDER BY o.CreatedAt DESC`);
    return ok(res, r.recordset);
  } catch (e) {
    next(e);
  }
};
exports.detail = async (req, res, next) => {
  try {
    const p = await getPool();
    const isManager = ["ADMIN", "STAFF"].includes(req.user.role);
    const rq = p.request().input("o", sql.Int, Number(req.params.id));
    let q = `SELECT o.*,p.Method PaymentMethod,p.Status PaymentStatus,p.TransactionCode,u.FullName CustomerName,u.Email CustomerEmail FROM Orders o LEFT JOIN Payments p ON p.OrderID=o.OrderID JOIN Users u ON u.UserID=o.UserID WHERE o.OrderID=@o`;
    if (!isManager) {
      rq.input("u", sql.Int, req.user.userID);
      q += " AND o.UserID=@u";
    }
    const order = (await rq.query(q)).recordset[0];
    if (!order) return fail(res, "Không tìm thấy đơn hàng", 404);
    order.items = (await p.request().input("o", sql.Int, order.OrderID).query("SELECT * FROM OrderDetails WHERE OrderID=@o")).recordset;
    order.history = (await p.request().input('o', sql.Int, order.OrderID).query('SELECT h.HistoryID,h.FromStatus,h.ToStatus,h.CreatedAt,u.FullName ChangedByName FROM OrderStatusHistory h LEFT JOIN Users u ON u.UserID=h.ChangedBy WHERE h.OrderID=@o ORDER BY h.HistoryID')).recordset;
    return ok(res, order);
  } catch (e) {
    next(e);
  }
};
exports.cancel = async (req, res, next) => {
  try {
    await orderService.cancel(req.user.userID, Number(req.params.id));
    return ok(res, null, "Hủy đơn hàng thành công");
  } catch (e) {
    next(e);
  }
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const orderService = require("../services/orderService");
// const { sql, getPool } = require("../config/database");
// const { ok, fail } = require("../utils/apiResponse");
// exports.checkout = async (req, res, next) => {
//   try {
//     if (!req.body.shippingAddress)
//       return fail(res, "Vui lòng nhập địa chỉ nhận hàng", 400);
//     return ok(
//       res,
//       await orderService.checkout(req.user.userID, req.body),
//       "Đặt hàng thành công",
//       201,
//     );
//   } catch (e) {
//     next(e);
//   }
// };
// exports.mine = async (req, res, next) => {
//   try {
//     const p = await getPool();
//     const r = await p
//       .request()
//       .input("u", sql.Int, req.user.userID)
//       .query(
//         `SELECT o.*,p.Method PaymentMethod,p.Status PaymentStatus FROM Orders o LEFT JOIN Payments p ON p.OrderID=o.OrderID WHERE o.UserID=@u ORDER BY o.CreatedAt DESC`,
//       );
//     return ok(res, r.recordset);
//   } catch (e) {
//     next(e);
//   }
// };
// exports.detail = async (req, res, next) => {
//   try {
//     const p = await getPool();
//     const isManager = ["ADMIN", "STAFF"].includes(req.user.role);
//     const rq = p.request().input("o", sql.Int, Number(req.params.id));
//     let q = `SELECT o.*,p.Method PaymentMethod,p.Status PaymentStatus,p.TransactionCode,u.FullName CustomerName,u.Email CustomerEmail FROM Orders o LEFT JOIN Payments p ON p.OrderID=o.OrderID JOIN Users u ON u.UserID=o.UserID WHERE o.OrderID=@o`;
//     if (!isManager) {
//       rq.input("u", sql.Int, req.user.userID);
//       q += " AND o.UserID=@u";
//     }
//     const order = (await rq.query(q)).recordset[0];
//     if (!order) return fail(res, "Không tìm thấy đơn hàng", 404);
//     order.items = (
//       await p
//         .request()
//         .input("o", sql.Int, order.OrderID)
//         .query("SELECT * FROM OrderDetails WHERE OrderID=@o")
//     ).recordset;
//     return ok(res, order);
//   } catch (e) {
//     next(e);
//   }
// };
// exports.cancel = async (req, res, next) => {
//   try {
//     await orderService.cancel(req.user.userID, Number(req.params.id));
//     return ok(res, null, "Hủy đơn hàng thành công");
//   } catch (e) {
//     next(e);
//   }
// };
// 
// ===== HET MA CU =====
