const router=require('express').Router(); const {getPool}=require('../config/database'); const {ok}=require('../utils/apiResponse');
router.get('/categories',async(_req,res,next)=>{try{const p=await getPool();return ok(res,(await p.request().query(`SELECT CategoryID,CategoryName,Slug,Description FROM Categories WHERE Status='ACTIVE' ORDER BY CategoryName`)).recordset)}catch(e){next(e)}});
router.get('/brands',async(_req,res,next)=>{try{const p=await getPool();return ok(res,(await p.request().query(`SELECT BrandID,BrandName,Slug,LogoUrl FROM Brands WHERE Status='ACTIVE' ORDER BY BrandName`)).recordset)}catch(e){next(e)}});
module.exports=router;
