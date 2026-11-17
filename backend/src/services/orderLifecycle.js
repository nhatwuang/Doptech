const {
  sql
} = require('../config/database');
const transaction = require('./transaction');
const {
  error,
  positiveInt,
  transition,
  payable
} = require('../utils/businessRules');
const request = tx => new sql.Request(tx);
async function lockOrder(tx, actor, id) {
  const order = (await request(tx).input('id', sql.Int, positiveInt(id)).query('SELECT * FROM Orders WITH(UPDLOCK,HOLDLOCK) WHERE OrderID=@id')).recordset[0];
  if (!order || actor.role === 'CUSTOMER' && order.UserID !== actor.userID) throw error('Không tìm thấy đơn hàng', 404);
  if (!['CUSTOMER', 'STAFF', 'ADMIN'].includes(actor.role)) throw error('Không có quyền', 403);
  return order;
}
async function history(tx, id, actor, from, to) {
  await request(tx).input('o', sql.Int, id).input('u', sql.Int, actor.userID).input('f', sql.VarChar(20), from).input('t', sql.VarChar(20), to).query('INSERT INTO OrderStatusHistory(OrderID,ChangedBy,FromStatus,ToStatus) VALUES(@o,@u,@f,@t)');
}
async function notify(tx, order, message) {
  await request(tx).input('o', sql.Int, order.OrderID).input('u', sql.Int, order.UserID).input('m', sql.NVarChar(700), message).query("INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Cập nhật đơn hàng',@m,'ORDER',@o)");
}
async function change(actor, id, status) {
  return transaction(async tx => {
    const order = await lockOrder(tx, actor, id);
    if (actor.role === 'CUSTOMER' && status !== 'CANCELLED') throw error('Không có quyền', 403);
    if (!transition(order.Status, status)) return {
      status,
      unchanged: true
    };
    const pay = (await request(tx).input('o', sql.Int, order.OrderID).query('SELECT * FROM Payments WITH(UPDLOCK,HOLDLOCK) WHERE OrderID=@o')).recordset[0];
    if (!pay) throw error('Đơn hàng thiếu thông tin thanh toán', 409);
    if (status === 'COMPLETED' && pay.Method !== 'COD' && pay.Status !== 'PAID') throw error('Cần xác nhận thanh toán trước khi hoàn thành', 409);
    if (status === 'CANCELLED') {
      const details = (await request(tx).input('o', sql.Int, order.OrderID).query('SELECT ProductID,Quantity FROM OrderDetails WHERE OrderID=@o ORDER BY ProductID')).recordset;
      for (const item of details) {
        const inv = (await request(tx).input('p', sql.Int, item.ProductID).query('SELECT Quantity FROM Inventory WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@p')).recordset[0];
        if (!inv) throw error('Không tìm thấy tồn kho', 409);
        await request(tx).input('p', sql.Int, item.ProductID).input('q', sql.Int, item.Quantity).input('b', sql.Int, inv.Quantity).input('a', sql.Int, inv.Quantity + item.Quantity).input('o', sql.Int, order.OrderID).input('u', sql.Int, actor.userID).query(`
          UPDATE Inventory SET Quantity=Quantity+@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@p;
          UPDATE Products SET SoldCount=CASE WHEN SoldCount>=@q THEN SoldCount-@q ELSE 0 END WHERE ProductID=@p;
          INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,ReferenceType,ReferenceID,Note,CreatedBy)
          VALUES(@p,'CANCEL_RESTORE',@q,@b,@a,'ORDER',@o,N'Hoàn kho do hủy đơn',@u);`);
      }
      if (order.CouponID) await request(tx).input('c', sql.Int, order.CouponID).query('UPDATE Coupons SET UsedCount=CASE WHEN UsedCount>0 THEN UsedCount-1 ELSE 0 END WHERE CouponID=@c');
      await request(tx).input('o', sql.Int, order.OrderID).query("UPDATE Payments SET Status=CASE WHEN Status='PAID' THEN 'REFUNDED' WHEN Status='PENDING' THEN 'FAILED' ELSE Status END WHERE OrderID=@o");
    }
    await request(tx).input('o', sql.Int, order.OrderID).input('s', sql.VarChar(20), status).query(`
      UPDATE Orders SET Status=@s,UpdatedAt=SYSDATETIME(),CompletedAt=CASE WHEN @s='COMPLETED' THEN SYSDATETIME() ELSE CompletedAt END WHERE OrderID=@o;
      UPDATE Payments SET Status='PAID',PaidAt=COALESCE(PaidAt,SYSDATETIME()) WHERE OrderID=@o AND Method='COD' AND @s='COMPLETED';`);
    await history(tx, order.OrderID, actor, order.Status, status);
    await notify(tx, order, `Đơn hàng chuyển sang ${status}.`);
    return {
      status
    };
  });
}
async function pay(actor, id) {
  return transaction(async tx => {
    const order = await lockOrder(tx, actor, id);
    if (actor.role === 'STAFF') throw error('Chỉ khách sở hữu đơn hoặc Admin được mô phỏng thanh toán', 403);
    const payment = (await request(tx).input('o', sql.Int, order.OrderID).query('SELECT * FROM Payments WITH(UPDLOCK,HOLDLOCK) WHERE OrderID=@o')).recordset[0];
    if (!payment) throw error('Không tìm thấy thanh toán', 404);
    if (!payable(order, payment)) return {
      unchanged: true
    };
    await request(tx).input('o', sql.Int, order.OrderID).query("UPDATE Payments SET Status='PAID',PaidAt=SYSDATETIME(),TransactionCode=COALESCE(TransactionCode,CONCAT('SIM-',@o)) WHERE OrderID=@o");
    await notify(tx, order, 'Thanh toán mô phỏng thành công.');
    return {
      status: 'PAID'
    };
  });
}
module.exports = {
  change,
  pay,
  history
};
