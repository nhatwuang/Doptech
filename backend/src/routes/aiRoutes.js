const router = require('express').Router();
const service = require('../services/aiService');
const {
  ok,
  fail
} = require('../utils/apiResponse');
const {
  optionalAuth,
  authenticateToken
} = require('../middleware/auth');
router.post('/chat', optionalAuth, require('../middleware/rateLimit')(20, 60000), async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();
    if (message.length < 2 || message.length > 2000) return fail(res, 'Câu hỏi cần từ 2 đến 2000 ký tự', 400);
    return ok(res, await service.chat(req.user?.userID || null, message, Array.isArray(req.body.history) ? req.body.history.filter(x => typeof x === 'string' && x.length <= 2000).slice(-6) : []), 'DopTech AI đã phản hồi');
  } catch (e) {
    next(e);
  }
});
router.get('/recommendations', optionalAuth, async (req, res, next) => {
  try {
    return ok(res, await service.recommendations(req.user?.userID || null));
  } catch (e) {
    next(e);
  }
});
router.get('/history', authenticateToken, async (req, res, next) => {
  try {
    const {
      sql,
      getPool
    } = require('../config/database');
    const p = await getPool();
    return ok(res, (await p.request().input('u', sql.Int, req.user.userID).query('SELECT TOP 30 * FROM AIChatHistory WHERE UserID=@u ORDER BY CreatedAt DESC')).recordset);
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const service=require('../services/aiService');const {ok,fail}=require('../utils/apiResponse');const {optionalAuth,authenticateToken}=require('../middleware/auth');
// router.post('/chat',optionalAuth,async(req,res,next)=>{try{const message=String(req.body.message||'').trim();if(message.length<2)return fail(res,'Vui lòng nhập câu hỏi',400);return ok(res,await service.chat(req.user?.userID||null,message),'DopTech AI đã phản hồi')}catch(e){next(e)}});
// router.get('/recommendations',optionalAuth,async(req,res,next)=>{try{return ok(res,await service.recommendations(req.user?.userID||null))}catch(e){next(e)}});
// router.get('/history',authenticateToken,async(req,res,next)=>{try{const {sql,getPool}=require('../config/database');const p=await getPool();return ok(res,(await p.request().input('u',sql.Int,req.user.userID).query('SELECT TOP 30 * FROM AIChatHistory WHERE UserID=@u ORDER BY CreatedAt DESC')).recordset)}catch(e){next(e)}});module.exports=router;
// 
// ===== HET MA CU =====
