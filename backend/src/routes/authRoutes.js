const router = require('express').Router();
const c = require('../controllers/authController');
const {
  authenticateToken
} = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerRules,
  loginRules
} = require('../validators/authValidators');
router.post('/register', require('../middleware/rateLimit')(10, 60000), registerRules, validate, c.register);
router.post('/login', require('../middleware/rateLimit')(20, 60000), loginRules, validate, c.login);
router.get('/me', authenticateToken, c.me);
router.post('/logout', authenticateToken, c.logout);
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();
// const c=require('../controllers/authController');
// const {authenticateToken}=require('../middleware/auth');
// const validate=require('../middleware/validate');
// const {registerRules,loginRules}=require('../validators/authValidators');
// router.post('/register',registerRules,validate,c.register);
// router.post('/login',loginRules,validate,c.login);
// router.get('/me',authenticateToken,c.me);
// router.post('/logout',authenticateToken,c.logout);
// module.exports=router;
// 
// ===== HET MA CU =====
