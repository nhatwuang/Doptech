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
router.get('/product/:productID', async (req, res, next) => {
  try {
    const p = await getPool();
    const r = await p.request().input('pid', sql.Int, Number(req.params.productID)).query(`SELECT r.ReviewID,r.Rating,r.Comment,r.CreatedAt,u.FullName FROM Reviews r JOIN Users u ON u.UserID=r.UserID WHERE r.ProductID=@pid AND r.Status='APPROVED' ORDER BY r.CreatedAt DESC`);
    return ok(res, r.recordset);
  } catch (e) {
    next(e);
  }
});
router.post('/', authenticateToken, authorizeRoles('CUSTOMER'), async (req, res, next) => {
  try {
    await require('../services/reviewService').create(req.user.userID, req.body);
    return ok(res, null, 'Đánh giá thành công', 201);
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const {sql,getPool}=require('../config/database');const {ok,fail}=require('../utils/apiResponse');const {authenticateToken,authorizeRoles}=require('../middleware/auth');
// router.get('/product/:productID',async(req,res,next)=>{try{const p=await getPool();const r=await p.request().input('pid',sql.Int,Number(req.params.productID)).query(`SELECT r.ReviewID,r.Rating,r.Comment,r.CreatedAt,u.FullName FROM Reviews r JOIN Users u ON u.UserID=r.UserID WHERE r.ProductID=@pid AND r.Status='APPROVED' ORDER BY r.CreatedAt DESC`);return ok(res,r.recordset)}catch(e){next(e)}});
// router.post('/',authenticateToken,authorizeRoles('CUSTOMER'),async(req,res,next)=>{try{const {productID,orderID,rating,comment}=req.body;const rate=Number(rating);if(!Number.isInteger(rate)||rate<1||rate>5)return fail(res,'Rating phải từ 1 đến 5',400);const p=await getPool();const bought=(await p.request().input('u',sql.Int,req.user.userID).input('o',sql.Int,Number(orderID)).input('pid',sql.Int,Number(productID)).query(`SELECT 1 x FROM Orders o JOIN OrderDetails od ON od.OrderID=o.OrderID WHERE o.OrderID=@o AND o.UserID=@u AND o.Status='COMPLETED' AND od.ProductID=@pid`)).recordset[0];if(!bought)return fail(res,'Chỉ có thể đánh giá sản phẩm đã mua trong đơn hoàn thành',403);try{await p.request().input('u',sql.Int,req.user.userID).input('o',sql.Int,Number(orderID)).input('pid',sql.Int,Number(productID)).input('r',sql.TinyInt,rate).input('c',sql.NVarChar(1500),comment||null).query('INSERT INTO Reviews(UserID,ProductID,OrderID,Rating,Comment) VALUES(@u,@pid,@o,@r,@c)')}catch(e){if(e.number===2627||e.number===2601)return fail(res,'Bạn đã đánh giá sản phẩm này cho đơn hàng này',409);throw e}await p.request().input('pid',sql.Int,Number(productID)).query(`UPDATE Products SET AverageRating=(SELECT CAST(AVG(CAST(Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)) FROM Reviews WHERE ProductID=@pid AND Status='APPROVED') WHERE ProductID=@pid`);return ok(res,null,'Đánh giá thành công',201)}catch(e){next(e)}});module.exports=router;
// 
// ===== HET MA CU =====
