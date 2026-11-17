const router=require('express').Router(); const c=require('../controllers/productController'); const {optionalAuth}=require('../middleware/auth');
router.get('/',c.list); router.get('/featured',c.featured); router.get('/:idOrSlug',optionalAuth,c.detail); module.exports=router;
