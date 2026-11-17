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
router.use(authenticateToken, authorizeRoles('ADMIN', 'STAFF'));
router.get('/', async (req, res, next) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`SELECT i.InventoryID,i.ProductID,p.ProductName,p.SKU,i.Quantity,i.ReservedQuantity,i.ReorderLevel,i.UpdatedAt,CASE WHEN i.Quantity=0 THEN 'OUT' WHEN i.Quantity<=i.ReorderLevel THEN 'LOW' ELSE 'OK' END StockStatus FROM Inventory i JOIN Products p ON p.ProductID=i.ProductID ORDER BY i.Quantity ASC,p.ProductName`);
    return ok(res, r.recordset);
  } catch (e) {
    next(e);
  }
});
router.post('/:productID/adjust', async (req, res, next) => {
  const mode = String(req.body.type || 'ADJUSTMENT').toUpperCase(),
    amount = Number(req.body.quantity);
  if (!['IMPORT', 'ADJUSTMENT', 'RETURN'].includes(mode) || !Number.isInteger(amount) || amount === 0) return fail(res, 'Dữ liệu điều chỉnh kho không hợp lệ', 400);
  if (req.user.role === 'STAFF' && mode !== 'IMPORT') return fail(res, 'Nhân viên chỉ được nhập kho', 403);
  let tx;
  try {
    const p = await getPool();
    tx = new sql.Transaction(p);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    const inv = (await new sql.Request(tx).input('pid', sql.Int, Number(req.params.productID)).query('SELECT Quantity,ReservedQuantity FROM Inventory WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@pid')).recordset[0];
    if (!inv) throw Object.assign(new Error('Không tìm thấy tồn kho'), {
      status: 404
    });
    if ((mode === 'IMPORT' || mode === 'RETURN') && amount < 0) throw Object.assign(new Error('Số lượng nhập phải dương'), {
      status: 400
    });
    const delta = amount;
    const after = inv.Quantity + delta;
    if (after < inv.ReservedQuantity) throw Object.assign(new Error('Tồn kho không thể thấp hơn số lượng đã giữ'), {
      status: 400
    });
    await new sql.Request(tx).input('pid', sql.Int, Number(req.params.productID)).input('q', sql.Int, after).query('UPDATE Inventory SET Quantity=@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@pid');
    await new sql.Request(tx).input('pid', sql.Int, Number(req.params.productID)).input('type', sql.VarChar(30), mode).input('qty', sql.Int, Math.abs(delta)).input('b', sql.Int, inv.Quantity).input('a', sql.Int, after).input('u', sql.Int, req.user.userID).input('note', sql.NVarChar(500), req.body.note || null).query('INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,Note,CreatedBy) VALUES(@pid,@type,@qty,@b,@a,@note,@u)');
    await tx.commit();
    return ok(res, {
      before: inv.Quantity,
      after
    }, 'Cập nhật tồn kho thành công');
  } catch (e) {
    try {
      await tx.rollback();
    } catch (_) {}
    next(e);
  }
});
router.get('/:productID/history', async (req, res, next) => {
  try {
    const id = require('../utils/businessRules').positiveInt(req.params.productID);
    const p = await getPool();
    return ok(res, (await p.request().input('id', sql.Int, id).query('SELECT TOP 100 t.*,u.FullName FROM InventoryTransactions t LEFT JOIN Users u ON u.UserID=t.CreatedBy WHERE t.ProductID=@id ORDER BY t.TransactionID DESC')).recordset);
  } catch (e) {
    next(e);
  }
});
module.exports = router;

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const router=require('express').Router();const {sql,getPool}=require('../config/database');const {ok,fail}=require('../utils/apiResponse');const {authenticateToken,authorizeRoles}=require('../middleware/auth');router.use(authenticateToken,authorizeRoles('ADMIN','STAFF'));
// router.get('/',async(req,res,next)=>{try{const p=await getPool();const r=await p.request().query(`SELECT i.InventoryID,i.ProductID,p.ProductName,p.SKU,i.Quantity,i.ReservedQuantity,i.ReorderLevel,i.UpdatedAt,CASE WHEN i.Quantity=0 THEN 'OUT' WHEN i.Quantity<=i.ReorderLevel THEN 'LOW' ELSE 'OK' END StockStatus FROM Inventory i JOIN Products p ON p.ProductID=i.ProductID ORDER BY i.Quantity ASC,p.ProductName`);return ok(res,r.recordset)}catch(e){next(e)}});
// router.post('/:productID/adjust',async(req,res,next)=>{const mode=String(req.body.type||'ADJUSTMENT').toUpperCase(),amount=Number(req.body.quantity);if(!['IMPORT','ADJUSTMENT','RETURN'].includes(mode)||!Number.isInteger(amount)||amount===0)return fail(res,'Dữ liệu điều chỉnh kho không hợp lệ',400);const p=await getPool(),tx=new sql.Transaction(p);try{await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);const inv=(await new sql.Request(tx).input('pid',sql.Int,Number(req.params.productID)).query('SELECT Quantity FROM Inventory WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@pid')).recordset[0];if(!inv)throw Object.assign(new Error('Không tìm thấy tồn kho'),{status:404});const delta=mode==='IMPORT'||mode==='RETURN'?Math.abs(amount):amount;const after=inv.Quantity+delta;if(after<0)throw Object.assign(new Error('Tồn kho không thể âm'),{status:400});await new sql.Request(tx).input('pid',sql.Int,Number(req.params.productID)).input('q',sql.Int,after).query('UPDATE Inventory SET Quantity=@q,UpdatedAt=SYSDATETIME() WHERE ProductID=@pid');await new sql.Request(tx).input('pid',sql.Int,Number(req.params.productID)).input('type',sql.VarChar(30),mode).input('qty',sql.Int,Math.abs(delta)).input('b',sql.Int,inv.Quantity).input('a',sql.Int,after).input('u',sql.Int,req.user.userID).input('note',sql.NVarChar(500),req.body.note||null).query('INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,Note,CreatedBy) VALUES(@pid,@type,@qty,@b,@a,@note,@u)');await tx.commit();return ok(res,{before:inv.Quantity,after},'Cập nhật tồn kho thành công')}catch(e){try{await tx.rollback()}catch(_){}next(e)}});module.exports=router;
// 
// ===== HET MA CU =====
