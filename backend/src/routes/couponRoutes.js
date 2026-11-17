const router = require('express').Router();
const {
  sql,
  getPool
} = require('../config/database');
const {
  ok,
  fail
} = require('../utils/apiResponse');
router.post('/validate', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase(),
      subtotal = Number(req.body.subtotal || 0);
    if (!code || code.length > 40 || !Number.isFinite(subtotal) || subtotal < 0) return fail(res, 'Mã hoặc tổng tiền không hợp lệ', 400);
    const p = await getPool();
    const c = (await p.request().input('code', sql.VarChar(40), code).query(`SELECT * FROM Coupons WHERE Code=@code AND Status='ACTIVE' AND StartDate<=SYSDATETIME() AND EndDate>=SYSDATETIME() AND (UsageLimit IS NULL OR UsedCount<UsageLimit)`)).recordset[0];
    if (!c) return fail(res, 'Voucher không hợp lệ', 400);
    if (subtotal < Number(c.MinOrderValue)) return fail(res, 'Chưa đạt giá trị đơn hàng tối thiểu', 400);
    let discount = c.DiscountType === 'PERCENT' ? subtotal * Number(c.DiscountValue) / 100 : Number(c.DiscountValue);
    if (c.MaxDiscount != null) discount = Math.min(discount, Number(c.MaxDiscount));
    return ok(res, {
      ...c,
      discountAmount: Math.round(Math.min(discount, subtotal) * 100) / 100
    });
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const {sql,getPool}=require('../config/database');const {ok,fail}=require('../utils/apiResponse');
// router.post('/validate',async(req,res,next)=>{try{const code=String(req.body.code||'').trim().toUpperCase(),subtotal=Number(req.body.subtotal||0);const p=await getPool();const c=(await p.request().input('code',sql.VarChar(40),code).query(`SELECT * FROM Coupons WHERE Code=@code AND Status='ACTIVE' AND StartDate<=SYSDATETIME() AND EndDate>=SYSDATETIME() AND (UsageLimit IS NULL OR UsedCount<UsageLimit)`)).recordset[0];if(!c)return fail(res,'Voucher không hợp lệ',400);if(subtotal<Number(c.MinOrderValue))return fail(res,'Chưa đạt giá trị đơn hàng tối thiểu',400);let discount=c.DiscountType==='PERCENT'?subtotal*Number(c.DiscountValue)/100:Number(c.DiscountValue);if(c.MaxDiscount!=null)discount=Math.min(discount,Number(c.MaxDiscount));return ok(res,{...c,discountAmount:Math.min(discount,subtotal)})}catch(e){next(e)}});module.exports=router;
// 
// ===== HET MA CU =====
