const {
  sql,
  getPool
} = require('../config/database');
const createOrderCode = require('../utils/orderCode');
function money(v) {
  return Math.round(Number(v) * 100) / 100;
}
exports.checkout = async (userID, payload) => {
  require('../utils/businessRules').checkoutInput(payload);
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    if (payload.requestKey) {
      const existing = (await new sql.Request(tx).input('u', sql.Int, userID).input('key', sql.VarChar(80), payload.requestKey).query('SELECT OrderID orderID,OrderCode orderCode,TotalAmount totalAmount,Status status FROM Orders WITH(UPDLOCK,HOLDLOCK) WHERE UserID=@u AND RequestKey=@key')).recordset[0];
      if (existing) {
        await tx.commit();
        return existing;
      }
    }
    const cart = (await new sql.Request(tx).input('u', sql.Int, userID).query('SELECT CartID FROM Carts WITH(UPDLOCK,HOLDLOCK) WHERE UserID=@u')).recordset[0];
    if (!cart) throw Object.assign(new Error('Giỏ hàng trống'), {
      status: 400
    });
    const items = (await new sql.Request(tx).input('c', sql.Int, cart.CartID).query(`SELECT ci.ProductID,ci.Quantity,p.ProductName,p.SKU,p.Price,p.DiscountPrice,p.Status,c.Status CategoryStatus,b.Status BrandStatus,i.Quantity StockQuantity,i.Quantity-i.ReservedQuantity AvailableQuantity FROM CartItems ci JOIN Products p ON p.ProductID=ci.ProductID JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID JOIN Inventory i WITH(UPDLOCK,HOLDLOCK) ON i.ProductID=p.ProductID WHERE ci.CartID=@c ORDER BY ci.ProductID`)).recordset;
    if (!items.length) throw Object.assign(new Error('Giỏ hàng trống'), {
      status: 400
    });
    for (const item of items) {
      if (item.Status !== 'ACTIVE' || item.CategoryStatus !== 'ACTIVE' || item.BrandStatus !== 'ACTIVE' || item.Quantity > item.AvailableQuantity) throw Object.assign(new Error(`Sản phẩm ${item.ProductName} không đủ tồn kho`), {
        status: 400
      });
    }
    const subtotal = money(items.reduce((s, x) => s + Number(x.DiscountPrice ?? x.Price) * x.Quantity, 0));
    let coupon = null,
      discount = 0;
    if (payload.couponCode) {
      coupon = (await new sql.Request(tx).input('code', sql.VarChar(40), String(payload.couponCode).trim().toUpperCase()).query(`SELECT * FROM Coupons WITH(UPDLOCK,HOLDLOCK) WHERE Code=@code AND Status='ACTIVE' AND StartDate<=SYSDATETIME() AND EndDate>=SYSDATETIME() AND (UsageLimit IS NULL OR UsedCount<UsageLimit)`)).recordset[0];
      if (!coupon) throw Object.assign(new Error('Voucher không hợp lệ hoặc đã hết hạn'), {
        status: 400
      });
      if (subtotal < Number(coupon.MinOrderValue)) throw Object.assign(new Error('Đơn hàng chưa đạt giá trị tối thiểu của voucher'), {
        status: 400
      });
      discount = coupon.DiscountType === 'PERCENT' ? subtotal * Number(coupon.DiscountValue) / 100 : Number(coupon.DiscountValue);
      if (coupon.MaxDiscount != null) discount = Math.min(discount, Number(coupon.MaxDiscount));
      discount = money(Math.min(discount, subtotal));
    }
    const shippingFee = payload.shippingMethod === 'EXPRESS' ? 50000 : 30000;
    const total = money(subtotal - discount + shippingFee);
    const code = createOrderCode();
    if (payload.expectedTotal != null && (!Number.isFinite(Number(payload.expectedTotal)) || Math.abs(Number(payload.expectedTotal) - total) > 0.01)) throw Object.assign(new Error('Giá hoặc voucher đã thay đổi. Vui lòng tải lại giỏ hàng và xác nhận tổng tiền.'), {
      status: 409
    });
    const user = (await new sql.Request(tx).input('u', sql.Int, userID).query('SELECT FullName,Email,Phone FROM Users WHERE UserID=@u')).recordset[0];
    const ins = await new sql.Request(tx).input('code', sql.VarChar(30), code).input('u', sql.Int, userID).input('coupon', sql.Int, coupon?.CouponID || null).input('name', sql.NVarChar(120), payload.receiverName || user.FullName).input('phone', sql.VarChar(20), payload.receiverPhone || user.Phone || '').input('email', sql.VarChar(160), payload.receiverEmail || user.Email).input('addr', sql.NVarChar(500), payload.shippingAddress).input('note', sql.NVarChar(500), payload.note || null).input('ship', sql.VarChar(30), payload.shippingMethod || 'STANDARD').input('sub', sql.Decimal(18, 2), subtotal).input('dis', sql.Decimal(18, 2), discount).input('fee', sql.Decimal(18, 2), shippingFee).input('total', sql.Decimal(18, 2), total).query(`INSERT INTO Orders(OrderCode,UserID,CouponID,ReceiverName,ReceiverPhone,ReceiverEmail,ShippingAddress,Note,ShippingMethod,Subtotal,DiscountAmount,ShippingFee,TotalAmount)
   OUTPUT INSERTED.OrderID VALUES(@code,@u,@coupon,@name,@phone,@email,@addr,@note,@ship,@sub,@dis,@fee,@total)`);
    const orderID = ins.recordset[0].OrderID;
    await new sql.Request(tx).input('o', sql.Int, orderID).input('key', sql.VarChar(80), payload.requestKey || null).query('UPDATE Orders SET RequestKey=@key WHERE OrderID=@o');
    await require('./orderLifecycle').history(tx, orderID, {
      userID
    }, null, 'PENDING');
    for (const item of items) {
      const unit = Number(item.DiscountPrice ?? item.Price);
      const before = item.StockQuantity,
        after = before - item.Quantity;
      await new sql.Request(tx).input('o', sql.Int, orderID).input('p', sql.Int, item.ProductID).input('n', sql.NVarChar(220), item.ProductName).input('sku', sql.VarChar(80), item.SKU).input('price', sql.Decimal(18, 2), unit).input('q', sql.Int, item.Quantity).query('INSERT INTO OrderDetails(OrderID,ProductID,ProductName,SKU,UnitPrice,Quantity) VALUES(@o,@p,@n,@sku,@price,@q)');
      await new sql.Request(tx).input('p', sql.Int, item.ProductID).input('q', sql.Int, item.Quantity).query('UPDATE Inventory SET Quantity=Quantity-@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@p; UPDATE Products SET SoldCount=SoldCount+@q WHERE ProductID=@p');
      await new sql.Request(tx).input('p', sql.Int, item.ProductID).input('q', sql.Int, item.Quantity).input('b', sql.Int, before).input('a', sql.Int, after).input('o', sql.Int, orderID).input('u', sql.Int, userID).query(`INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,ReferenceType,ReferenceID,Note,CreatedBy) VALUES(@p,'SALE',@q,@b,@a,'ORDER',@o,N'Bán hàng',@u)`);
    }
    const method = ['COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO'].includes(payload.paymentMethod) ? payload.paymentMethod : 'COD';
    await new sql.Request(tx).input('o', sql.Int, orderID).input('m', sql.VarChar(30), method).input('a', sql.Decimal(18, 2), total).query(`INSERT INTO Payments(OrderID,Method,Amount,Status,TransactionCode) VALUES(@o,@m,@a,'PENDING',CASE WHEN @m='COD' THEN NULL ELSE CONCAT('SIM-',@o) END)`);
    if (coupon) await new sql.Request(tx).input('id', sql.Int, coupon.CouponID).query('UPDATE Coupons SET UsedCount=UsedCount+1 WHERE CouponID=@id');
    await new sql.Request(tx).input('c', sql.Int, cart.CartID).query('DELETE FROM CartItems WHERE CartID=@c');
    await new sql.Request(tx).input('u', sql.Int, userID).input('o', sql.Int, orderID).query(`INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Đặt hàng thành công',N'Đơn hàng của bạn đã được tạo và đang chờ xác nhận.','ORDER',@o)`);
    await tx.commit();
    return {
      orderID,
      orderCode: code,
      subtotal,
      discountAmount: discount,
      shippingFee,
      totalAmount: total,
      status: 'PENDING',
      paymentMethod: method
    };
  } catch (e) {
    try {
      await tx.rollback();
    } catch (_) {}
    throw e;
  }
};
exports.cancel = (userID, orderID) => require('./orderLifecycle').change({
  userID,
  role: 'CUSTOMER'
}, orderID, 'CANCELLED');

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const { sql, getPool } = require('../config/database');
// const createOrderCode=require('../utils/orderCode');
// 
// function money(v){return Math.round(Number(v)*100)/100}
// 
// exports.checkout=async(userID,payload)=>{
//  const pool=await getPool(); const tx=new sql.Transaction(pool); await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
//  try{
//   const cart=(await new sql.Request(tx).input('u',sql.Int,userID).query('SELECT CartID FROM Carts WHERE UserID=@u')).recordset[0];
//   if(!cart) throw Object.assign(new Error('Giỏ hàng trống'),{status:400});
//   const items=(await new sql.Request(tx).input('c',sql.Int,cart.CartID).query(`SELECT ci.ProductID,ci.Quantity,p.ProductName,p.SKU,p.Price,p.DiscountPrice,p.Status,i.Quantity StockQuantity FROM CartItems ci JOIN Products p ON p.ProductID=ci.ProductID JOIN Inventory i WITH(UPDLOCK,HOLDLOCK) ON i.ProductID=p.ProductID WHERE ci.CartID=@c`)).recordset;
//   if(!items.length) throw Object.assign(new Error('Giỏ hàng trống'),{status:400});
//   for(const item of items){if(item.Status!=='ACTIVE'||item.Quantity>item.StockQuantity)throw Object.assign(new Error(`Sản phẩm ${item.ProductName} không đủ tồn kho`),{status:400})}
//   const subtotal=money(items.reduce((s,x)=>s+Number(x.DiscountPrice??x.Price)*x.Quantity,0));
//   let coupon=null,discount=0;
//   if(payload.couponCode){coupon=(await new sql.Request(tx).input('code',sql.VarChar(40),String(payload.couponCode).trim().toUpperCase()).query(`SELECT * FROM Coupons WITH(UPDLOCK,HOLDLOCK) WHERE Code=@code AND Status='ACTIVE' AND StartDate<=SYSDATETIME() AND EndDate>=SYSDATETIME() AND (UsageLimit IS NULL OR UsedCount<UsageLimit)`)).recordset[0];
//    if(!coupon) throw Object.assign(new Error('Voucher không hợp lệ hoặc đã hết hạn'),{status:400});
//    if(subtotal<Number(coupon.MinOrderValue)) throw Object.assign(new Error('Đơn hàng chưa đạt giá trị tối thiểu của voucher'),{status:400});
//    discount=coupon.DiscountType==='PERCENT'?subtotal*Number(coupon.DiscountValue)/100:Number(coupon.DiscountValue); if(coupon.MaxDiscount!=null)discount=Math.min(discount,Number(coupon.MaxDiscount)); discount=money(Math.min(discount,subtotal));
//   }
//   const shippingFee=payload.shippingMethod==='EXPRESS'?50000:30000; const total=money(subtotal-discount+shippingFee); const code=createOrderCode();
//   const user=(await new sql.Request(tx).input('u',sql.Int,userID).query('SELECT FullName,Email,Phone FROM Users WHERE UserID=@u')).recordset[0];
//   const ins=await new sql.Request(tx)
//    .input('code',sql.VarChar(30),code).input('u',sql.Int,userID).input('coupon',sql.Int,coupon?.CouponID||null)
//    .input('name',sql.NVarChar(120),payload.receiverName||user.FullName).input('phone',sql.VarChar(20),payload.receiverPhone||user.Phone||'')
//    .input('email',sql.VarChar(160),payload.receiverEmail||user.Email).input('addr',sql.NVarChar(500),payload.shippingAddress)
//    .input('note',sql.NVarChar(500),payload.note||null).input('ship',sql.VarChar(30),payload.shippingMethod||'STANDARD')
//    .input('sub',sql.Decimal(18,2),subtotal).input('dis',sql.Decimal(18,2),discount).input('fee',sql.Decimal(18,2),shippingFee).input('total',sql.Decimal(18,2),total)
//    .query(`INSERT INTO Orders(OrderCode,UserID,CouponID,ReceiverName,ReceiverPhone,ReceiverEmail,ShippingAddress,Note,ShippingMethod,Subtotal,DiscountAmount,ShippingFee,TotalAmount)
//    OUTPUT INSERTED.OrderID VALUES(@code,@u,@coupon,@name,@phone,@email,@addr,@note,@ship,@sub,@dis,@fee,@total)`);
//   const orderID=ins.recordset[0].OrderID;
//   for(const item of items){const unit=Number(item.DiscountPrice??item.Price);const before=item.StockQuantity,after=before-item.Quantity;
//    await new sql.Request(tx).input('o',sql.Int,orderID).input('p',sql.Int,item.ProductID).input('n',sql.NVarChar(220),item.ProductName).input('sku',sql.VarChar(80),item.SKU).input('price',sql.Decimal(18,2),unit).input('q',sql.Int,item.Quantity).query('INSERT INTO OrderDetails(OrderID,ProductID,ProductName,SKU,UnitPrice,Quantity) VALUES(@o,@p,@n,@sku,@price,@q)');
//    await new sql.Request(tx).input('p',sql.Int,item.ProductID).input('q',sql.Int,item.Quantity).query('UPDATE Inventory SET Quantity=Quantity-@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@p; UPDATE Products SET SoldCount=SoldCount+@q WHERE ProductID=@p');
//    await new sql.Request(tx).input('p',sql.Int,item.ProductID).input('q',sql.Int,item.Quantity).input('b',sql.Int,before).input('a',sql.Int,after).input('o',sql.Int,orderID).input('u',sql.Int,userID).query(`INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,ReferenceType,ReferenceID,Note,CreatedBy) VALUES(@p,'SALE',@q,@b,@a,'ORDER',@o,N'Bán hàng',@u)`);
//   }
//   const method=['COD','BANK_TRANSFER','VNPAY','MOMO'].includes(payload.paymentMethod)?payload.paymentMethod:'COD';
//   await new sql.Request(tx).input('o',sql.Int,orderID).input('m',sql.VarChar(30),method).input('a',sql.Decimal(18,2),total).query(`INSERT INTO Payments(OrderID,Method,Amount,Status,TransactionCode) VALUES(@o,@m,@a,'PENDING',CASE WHEN @m='COD' THEN NULL ELSE CONCAT('SIM-',@o) END)`);
//   if(coupon)await new sql.Request(tx).input('id',sql.Int,coupon.CouponID).query('UPDATE Coupons SET UsedCount=UsedCount+1 WHERE CouponID=@id');
//   await new sql.Request(tx).input('c',sql.Int,cart.CartID).query('DELETE FROM CartItems WHERE CartID=@c');
//   await new sql.Request(tx).input('u',sql.Int,userID).input('o',sql.Int,orderID).query(`INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Đặt hàng thành công',N'Đơn hàng của bạn đã được tạo và đang chờ xác nhận.','ORDER',@o)`);
//   await tx.commit(); return {orderID,orderCode:code,subtotal,discountAmount:discount,shippingFee,totalAmount:total,status:'PENDING',paymentMethod:method};
//  }catch(e){try{await tx.rollback()}catch(_){} throw e}
// };
// 
// exports.cancel=async(userID,orderID)=>{const pool=await getPool();const tx=new sql.Transaction(pool);await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);try{
//  const order=(await new sql.Request(tx).input('o',sql.Int,orderID).input('u',sql.Int,userID).query('SELECT * FROM Orders WITH(UPDLOCK,HOLDLOCK) WHERE OrderID=@o AND UserID=@u')).recordset[0];if(!order)throw Object.assign(new Error('Không tìm thấy đơn hàng'),{status:404});if(!['PENDING','CONFIRMED'].includes(order.Status))throw Object.assign(new Error('Đơn hàng không thể hủy ở trạng thái hiện tại'),{status:400});
//  const details=(await new sql.Request(tx).input('o',sql.Int,orderID).query('SELECT ProductID,Quantity FROM OrderDetails WHERE OrderID=@o')).recordset;
//  for(const d of details){const inv=(await new sql.Request(tx).input('p',sql.Int,d.ProductID).query('SELECT Quantity FROM Inventory WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@p')).recordset[0];const before=inv.Quantity,after=before+d.Quantity;await new sql.Request(tx).input('p',sql.Int,d.ProductID).input('q',sql.Int,d.Quantity).query('UPDATE Inventory SET Quantity=Quantity+@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@p; UPDATE Products SET SoldCount=CASE WHEN SoldCount>=@q THEN SoldCount-@q ELSE 0 END WHERE ProductID=@p');await new sql.Request(tx).input('p',sql.Int,d.ProductID).input('q',sql.Int,d.Quantity).input('b',sql.Int,before).input('a',sql.Int,after).input('o',sql.Int,orderID).input('u',sql.Int,userID).query(`INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,ReferenceType,ReferenceID,Note,CreatedBy) VALUES(@p,'CANCEL_RESTORE',@q,@b,@a,'ORDER',@o,N'Hoàn kho do hủy đơn',@u)`)}
//  await new sql.Request(tx).input('o',sql.Int,orderID).query(`UPDATE Orders SET Status='CANCELLED',UpdatedAt=SYSDATETIME() WHERE OrderID=@o; UPDATE Payments SET Status=CASE WHEN Status='PAID' THEN 'REFUNDED' ELSE Status END WHERE OrderID=@o`);if(order.CouponID)await new sql.Request(tx).input('c',sql.Int,order.CouponID).query('UPDATE Coupons SET UsedCount=CASE WHEN UsedCount>0 THEN UsedCount-1 ELSE 0 END WHERE CouponID=@c');
//  await new sql.Request(tx).input('u',sql.Int,userID).input('o',sql.Int,orderID).query(`INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Đơn hàng đã hủy',N'Tồn kho đã được hoàn lại.','ORDER',@o)`);await tx.commit();return true;
// }catch(e){try{await tx.rollback()}catch(_){}throw e}};
// 
// ===== HET MA CU =====
