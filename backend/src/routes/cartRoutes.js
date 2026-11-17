const router = require('express').Router();
const {
  sql,
  getPool
} = require('../config/database');
const {
  ok,
  fail
} = require('../utils/apiResponse');
const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/auth');
router.use(authenticateToken, authorizeRoles('CUSTOMER'));
async function cartId(pool, userID) {
  let r = await pool.request().input('u', sql.Int, userID).query('SELECT CartID FROM Carts WHERE UserID=@u');
  if (r.recordset[0]) return r.recordset[0].CartID;
  return (await pool.request().input('u', sql.Int, userID).query('INSERT INTO Carts(UserID) OUTPUT INSERTED.CartID VALUES(@u)')).recordset[0].CartID;
}
router.get('/', async (req, res, next) => {
  try {
    const p = await getPool();
    const id = await cartId(p, req.user.userID);
    const r = await p.request().input('c', sql.Int, id).query(`SELECT ci.CartItemID,ci.ProductID,ci.Quantity,p.ProductName,p.Slug,p.Thumbnail,p.Price,p.DiscountPrice,COALESCE(p.DiscountPrice,p.Price) UnitPrice,i.Quantity StockQuantity FROM CartItems ci JOIN Products p ON p.ProductID=ci.ProductID LEFT JOIN Inventory i ON i.ProductID=p.ProductID WHERE ci.CartID=@c`);
    const subtotal = r.recordset.reduce((s, x) => s + Number(x.UnitPrice) * x.Quantity, 0);
    return ok(res, {
      items: r.recordset,
      subtotal
    });
  } catch (e) {
    next(e);
  }
});
router.post('/items', async (req, res, next) => {
  try {
    await require('../services/cartService').save(req.user.userID, req.body);
    return ok(res, null, 'Đã thêm vào giỏ', 201);
  } catch (e) {
    next(e);
  }
});
router.put('/items/:id', async (req, res, next) => {
  try {
    await require('../services/cartService').save(req.user.userID, req.body, req.params.id);
    return ok(res, null, 'Đã cập nhật giỏ');
  } catch (e) {
    next(e);
  }
});
router.delete('/items/:id', async (req, res, next) => {
  try {
    const p = await getPool();
    await p.request().input('id', sql.Int, Number(req.params.id)).input('u', sql.Int, req.user.userID).query('DELETE ci FROM CartItems ci JOIN Carts c ON c.CartID=ci.CartID WHERE ci.CartItemID=@id AND c.UserID=@u');
    return ok(res, null, 'Đã xóa khỏi giỏ hàng');
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router(); const {sql,getPool}=require('../config/database'); const {ok,fail}=require('../utils/apiResponse'); const {authenticateToken,authorizeRoles}=require('../middleware/auth');
// router.use(authenticateToken,authorizeRoles('CUSTOMER'));
// async function cartId(pool,userID){let r=await pool.request().input('u',sql.Int,userID).query('SELECT CartID FROM Carts WHERE UserID=@u');if(r.recordset[0])return r.recordset[0].CartID;return (await pool.request().input('u',sql.Int,userID).query('INSERT INTO Carts(UserID) OUTPUT INSERTED.CartID VALUES(@u)')).recordset[0].CartID}
// router.get('/',async(req,res,next)=>{try{const p=await getPool();const id=await cartId(p,req.user.userID);const r=await p.request().input('c',sql.Int,id).query(`SELECT ci.CartItemID,ci.ProductID,ci.Quantity,p.ProductName,p.Slug,p.Thumbnail,p.Price,p.DiscountPrice,COALESCE(p.DiscountPrice,p.Price) UnitPrice,i.Quantity StockQuantity FROM CartItems ci JOIN Products p ON p.ProductID=ci.ProductID LEFT JOIN Inventory i ON i.ProductID=p.ProductID WHERE ci.CartID=@c`);const subtotal=r.recordset.reduce((s,x)=>s+Number(x.UnitPrice)*x.Quantity,0);return ok(res,{items:r.recordset,subtotal})}catch(e){next(e)}});
// router.post('/items',async(req,res,next)=>{try{const pid=Number(req.body.productID),qty=Math.max(1,Number(req.body.quantity||1));const p=await getPool();const stock=(await p.request().input('p',sql.Int,pid).query(`SELECT i.Quantity,p.Status FROM Inventory i JOIN Products p ON p.ProductID=i.ProductID WHERE i.ProductID=@p`)).recordset[0];if(!stock||stock.Status!=='ACTIVE')return fail(res,'Sản phẩm không khả dụng',404);const id=await cartId(p,req.user.userID);const current=(await p.request().input('c',sql.Int,id).input('p',sql.Int,pid).query('SELECT Quantity FROM CartItems WHERE CartID=@c AND ProductID=@p')).recordset[0]?.Quantity||0;if(current+qty>stock.Quantity)return fail(res,'Số lượng vượt quá tồn kho',400);await p.request().input('c',sql.Int,id).input('p',sql.Int,pid).input('q',sql.Int,qty).query(`IF EXISTS(SELECT 1 FROM CartItems WHERE CartID=@c AND ProductID=@p) UPDATE CartItems SET Quantity=Quantity+@q WHERE CartID=@c AND ProductID=@p ELSE INSERT INTO CartItems(CartID,ProductID,Quantity) VALUES(@c,@p,@q); UPDATE Carts SET UpdatedAt=SYSDATETIME() WHERE CartID=@c`);return ok(res,null,'Đã thêm vào giỏ hàng',201)}catch(e){next(e)}});
// router.put('/items/:id',async(req,res,next)=>{try{const qty=Number(req.body.quantity);if(!Number.isInteger(qty)||qty<1)return fail(res,'Số lượng không hợp lệ',400);const p=await getPool();const r=await p.request().input('id',sql.Int,Number(req.params.id)).input('u',sql.Int,req.user.userID).query(`SELECT ci.CartItemID,i.Quantity StockQuantity FROM CartItems ci JOIN Carts c ON c.CartID=ci.CartID JOIN Inventory i ON i.ProductID=ci.ProductID WHERE ci.CartItemID=@id AND c.UserID=@u`);if(!r.recordset[0])return fail(res,'Không tìm thấy sản phẩm trong giỏ',404);if(qty>r.recordset[0].StockQuantity)return fail(res,'Số lượng vượt quá tồn kho',400);await p.request().input('id',sql.Int,Number(req.params.id)).input('q',sql.Int,qty).query('UPDATE CartItems SET Quantity=@q WHERE CartItemID=@id');return ok(res,null,'Đã cập nhật giỏ hàng')}catch(e){next(e)}});
// router.delete('/items/:id',async(req,res,next)=>{try{const p=await getPool();await p.request().input('id',sql.Int,Number(req.params.id)).input('u',sql.Int,req.user.userID).query('DELETE ci FROM CartItems ci JOIN Carts c ON c.CartID=ci.CartID WHERE ci.CartItemID=@id AND c.UserID=@u');return ok(res,null,'Đã xóa khỏi giỏ hàng')}catch(e){next(e)}});
// module.exports=router;
// 
// ===== HET MA CU =====
