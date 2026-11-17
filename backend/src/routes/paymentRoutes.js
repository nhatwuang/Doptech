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
  authenticateToken
} = require('../middleware/auth');
router.use(authenticateToken);
router.get('/order/:orderID', async (req, res, next) => {
  try {
    const p = await getPool();
    const rq = p.request().input('o', sql.Int, Number(req.params.orderID));
    let q = `SELECT pay.* FROM Payments pay JOIN Orders o ON o.OrderID=pay.OrderID WHERE pay.OrderID=@o`;
    if (req.user.role === 'CUSTOMER') {
      rq.input('u', sql.Int, req.user.userID);
      q += ' AND o.UserID=@u';
    }
    const x = (await rq.query(q)).recordset[0];
    if (!x) return fail(res, 'Không tìm thấy thanh toán', 404);
    return ok(res, x);
  } catch (e) {
    next(e);
  }
});
router.post('/order/:orderID/simulate-success', async (req, res, next) => {
  try {
    return ok(res, await require('../services/orderLifecycle').pay(req.user, req.params.orderID), 'Đã xác nhận thanh toán mô phỏng');
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const {sql,getPool}=require('../config/database');const {ok,fail}=require('../utils/apiResponse');const {authenticateToken}=require('../middleware/auth');router.use(authenticateToken);
// router.get('/order/:orderID',async(req,res,next)=>{try{const p=await getPool();const rq=p.request().input('o',sql.Int,Number(req.params.orderID));let q=`SELECT pay.* FROM Payments pay JOIN Orders o ON o.OrderID=pay.OrderID WHERE pay.OrderID=@o`;if(req.user.role==='CUSTOMER'){rq.input('u',sql.Int,req.user.userID);q+=' AND o.UserID=@u'}const x=(await rq.query(q)).recordset[0];if(!x)return fail(res,'Không tìm thấy thanh toán',404);return ok(res,x)}catch(e){next(e)}});
// router.post('/order/:orderID/simulate-success',async(req,res,next)=>{try{const p=await getPool();const rq=p.request().input('o',sql.Int,Number(req.params.orderID));let where='pay.OrderID=@o';if(req.user.role==='CUSTOMER'){rq.input('u',sql.Int,req.user.userID);where+=' AND o.UserID=@u'}const pay=(await rq.query(`SELECT pay.PaymentID,pay.Method,pay.Status,o.UserID FROM Payments pay JOIN Orders o ON o.OrderID=pay.OrderID WHERE ${where}`)).recordset[0];if(!pay)return fail(res,'Không tìm thấy thanh toán',404);if(pay.Method==='COD')return fail(res,'COD được thanh toán khi hoàn thành đơn',400);if(pay.Status==='PAID')return ok(res,pay,'Giao dịch đã được mô phỏng thành công trước đó');await p.request().input('o',sql.Int,Number(req.params.orderID)).query(`UPDATE Payments SET Status='PAID',PaidAt=SYSDATETIME(),TransactionCode=COALESCE(TransactionCode,CONCAT('SIM-',@o)) WHERE OrderID=@o`);await p.request().input('u',sql.Int,pay.UserID).input('o',sql.Int,Number(req.params.orderID)).query(`INSERT INTO Notifications(UserID,Title,Message,Type,ReferenceID) VALUES(@u,N'Thanh toán thành công',N'Giao dịch mô phỏng đã được xác nhận.','PAYMENT',@o)`);return ok(res,null,'Mô phỏng thanh toán thành công')}catch(e){next(e)}});
// module.exports=router;
// 
// ===== HET MA CU =====
