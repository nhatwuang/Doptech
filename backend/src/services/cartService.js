const {
  sql
} = require('../config/database');
const transaction = require('./transaction');
const {
  positiveInt,
  error
} = require('../utils/businessRules');
exports.save = (userID, x, itemID) => transaction(async tx => {
  const quantity = positiveInt(x.quantity ?? 1, 'Số lượng');
  const request = () => new sql.Request(tx);
  const cart = (await request().input('u', sql.Int, userID).query('SELECT CartID FROM Carts WITH(UPDLOCK,HOLDLOCK) WHERE UserID=@u')).recordset[0];
  if (!cart) throw error('Không tìm thấy giỏ hàng', 404);
  let pid, current;
  if (itemID) {
    current = (await request().input('c', sql.Int, cart.CartID).input('id', sql.Int, positiveInt(itemID)).query('SELECT ProductID,Quantity FROM CartItems WITH(UPDLOCK,HOLDLOCK) WHERE CartItemID=@id AND CartID=@c')).recordset[0];
    if (!current) throw error('Không tìm thấy sản phẩm trong giỏ', 404);
    pid = current.ProductID;
  } else {
    pid = positiveInt(x.productID);
    current = (await request().input('c', sql.Int, cart.CartID).input('p', sql.Int, pid).query('SELECT Quantity FROM CartItems WITH(UPDLOCK,HOLDLOCK) WHERE CartID=@c AND ProductID=@p')).recordset[0];
  }
  const stock = (await request().input('p', sql.Int, pid).query("SELECT i.Quantity-i.ReservedQuantity Available FROM Inventory i WITH(UPDLOCK,HOLDLOCK) JOIN Products p ON p.ProductID=i.ProductID JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID WHERE i.ProductID=@p AND p.Status='ACTIVE' AND c.Status='ACTIVE' AND b.Status='ACTIVE'")).recordset[0];
  if (!stock) throw error('Sản phẩm không khả dụng', 404);
  const total = itemID ? quantity : quantity + (current?.Quantity || 0);
  if (total > stock.Available) throw error('Số lượng vượt quá tồn kho');
  await request().input('c', sql.Int, cart.CartID).input('p', sql.Int, pid).input('q', sql.Int, total).query(current ? 'UPDATE CartItems SET Quantity=@q WHERE CartID=@c AND ProductID=@p' : 'INSERT INTO CartItems(CartID,ProductID,Quantity) VALUES(@c,@p,@q)');
  await request().input('c', sql.Int, cart.CartID).query('UPDATE Carts SET UpdatedAt=SYSDATETIME() WHERE CartID=@c');
});
