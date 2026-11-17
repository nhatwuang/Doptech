const {
  sql
} = require('../config/database');
const transaction = require('./transaction');
const {
  error,
  positiveInt
} = require('../utils/businessRules');
async function recalculate(tx, pid) {
  await new sql.Request(tx).input('p', sql.Int, pid).query("UPDATE Products SET AverageRating=COALESCE((SELECT AVG(CAST(Rating AS DECIMAL(4,2))) FROM Reviews WHERE ProductID=@p AND Status='APPROVED'),0) WHERE ProductID=@p");
}
async function lockProduct(tx, pid) {
  const p = (await new sql.Request(tx).input('p', sql.Int, pid).query('SELECT ProductID FROM Products WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@p')).recordset[0];
  if (!p) throw error('Không tìm thấy sản phẩm', 404);
}
exports.create = async (userID, x) => transaction(async tx => {
  const pid = positiveInt(x.productID),
    oid = positiveInt(x.orderID),
    rating = Number(x.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw error('Số sao từ 1 đến 5');
  if (x.comment != null && (typeof x.comment !== 'string' || x.comment.length > 1500)) throw error('Nhận xét tối đa 1500 ký tự');
  const bought = (await new sql.Request(tx).input('u', sql.Int, userID).input('o', sql.Int, oid).input('p', sql.Int, pid).query("SELECT 1 x FROM Orders o JOIN OrderDetails d ON d.OrderID=o.OrderID WHERE o.UserID=@u AND o.OrderID=@o AND d.ProductID=@p AND o.Status='COMPLETED'")).recordset[0];
  if (!bought) throw error('Chỉ đánh giá sản phẩm đã mua trong đơn hoàn thành', 403);
  await lockProduct(tx, pid);
  await new sql.Request(tx).input('u', sql.Int, userID).input('o', sql.Int, oid).input('p', sql.Int, pid).input('r', sql.Int, rating).input('c', sql.NVarChar(1500), x.comment || null).query('INSERT INTO Reviews(UserID,ProductID,OrderID,Rating,Comment) VALUES(@u,@p,@o,@r,@c)');
  await recalculate(tx, pid);
});
exports.moderate = async (id, status) => transaction(async tx => {
  if (!['APPROVED', 'HIDDEN', 'PENDING'].includes(status)) throw error('Trạng thái đánh giá không hợp lệ');
  const row = (await new sql.Request(tx).input('id', sql.Int, positiveInt(id)).query('SELECT ProductID FROM Reviews WHERE ReviewID=@id')).recordset[0];
  if (!row) throw error('Không tìm thấy đánh giá', 404);
  await lockProduct(tx, row.ProductID);
  await new sql.Request(tx).input('id', sql.Int, Number(id)).input('s', sql.VarChar(20), status).query('UPDATE Reviews SET Status=@s WHERE ReviewID=@id');
  await recalculate(tx, row.ProductID);
});
