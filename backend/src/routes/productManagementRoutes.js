const router = require('express').Router();
const slugify = require('slugify');
const {
  sql,
  getPool
} = require('../config/database');
const transaction = require('../services/transaction');
const {
  authorizeRoles
} = require('../middleware/auth');
const {
  ok
} = require('../utils/apiResponse');
const {
  error,
  positiveInt
} = require('../utils/businessRules');
const admin = authorizeRoles('ADMIN');
const handler = fn => async (req, res, next) => {
  try {
    return ok(res, await fn(req));
  } catch (e) {
    next(e);
  }
};
const request = tx => new sql.Request(tx);
function validate(x) {
  for (const [k, max] of [['productName', 220], ['sku', 80]]) if (typeof x[k] !== 'string' || !x[k].trim() || x[k].length > max) throw error('Tên hoặc SKU không hợp lệ');
  positiveInt(x.categoryID, 'Danh mục');
  positiveInt(x.brandID, 'Thương hiệu');
  if (x.price === '' || x.price == null || !Number.isFinite(Number(x.price)) || Number(x.price) < 0) throw error('Giá không hợp lệ');
  if (x.discountPrice !== '' && x.discountPrice != null && (!Number.isFinite(Number(x.discountPrice)) || Number(x.discountPrice) < 0 || Number(x.discountPrice) > Number(x.price))) throw error('Giá giảm phải từ 0 đến giá bán');
  if (!['ACTIVE', 'INACTIVE', 'DISCONTINUED'].includes(x.status || 'ACTIVE')) throw error('Trạng thái không hợp lệ');
  for (const [k, max] of [['description', 20000], ['shortDescription', 700]]) if (x[k] != null && (typeof x[k] !== 'string' || x[k].length > max)) throw error('Mô tả không hợp lệ hoặc quá dài');
  if (!Array.isArray(x.specifications) || x.specifications.length > 60 || !Array.isArray(x.images) || x.images.length > 20) throw error('Thông số hoặc ảnh không hợp lệ');
  const names = new Set();
  for (const s of x.specifications) {
    if (!s || typeof s.name !== 'string' || !s.name.trim() || s.name.length > 120 || typeof s.value !== 'string' || !s.value.trim() || s.value.length > 500 || names.has(s.name.trim().toLowerCase())) throw error('Thông số trùng tên hoặc thiếu giá trị');
    names.add(s.name.trim().toLowerCase());
  }
  for (const url of [x.thumbnail, ...x.images].filter(Boolean)) {
    if (typeof url !== 'string' || url.length > 500 || !/^https?:\/\//i.test(url)) throw error('Ảnh phải là đường dẫn http hoặc https');
  }
  if (!Number.isSafeInteger(Number(x.stock ?? 0)) || Number(x.stock ?? 0) < 0 || Number(x.stock ?? 0) > 2147483647) throw error('Tồn kho ban đầu không hợp lệ');
}
router.get('/products/:id', admin, handler(async r => {
  const p = await getPool(),
    id = positiveInt(r.params.id);
  const x = (await p.request().input('id', sql.Int, id).query('SELECT * FROM Products WHERE ProductID=@id')).recordset[0];
  if (!x) throw error('Không tìm thấy sản phẩm', 404);
  x.specifications = (await p.request().input('id', sql.Int, id).query('SELECT SpecName name,SpecValue value FROM ProductSpecifications WHERE ProductID=@id ORDER BY SortOrder')).recordset;
  x.images = (await p.request().input('id', sql.Int, id).query('SELECT ImageUrl FROM ProductImages WHERE ProductID=@id ORDER BY SortOrder')).recordset.map(i => i.ImageUrl);
  return x;
}));
async function save(r) {
  const x = r.body;
  validate(x);
  return transaction(async tx => {
    const id = r.params.id ? positiveInt(r.params.id) : null;
    if (id && !(await request(tx).input('id', sql.Int, id).query('SELECT ProductID FROM Products WITH(UPDLOCK,HOLDLOCK) WHERE ProductID=@id')).recordset[0]) throw error('Không tìm thấy sản phẩm', 404);
    const rq = request(tx).input('id', sql.Int, id).input('n', sql.NVarChar(220), x.productName.trim()).input('sku', sql.VarChar(80), x.sku.trim()).input('c', sql.Int, Number(x.categoryID)).input('b', sql.Int, Number(x.brandID)).input('price', sql.Decimal(18, 2), Number(x.price)).input('dp', sql.Decimal(18, 2), x.discountPrice === '' || x.discountPrice == null ? null : Number(x.discountPrice)).input('d', sql.NVarChar(sql.MAX), x.description || null).input('sd', sql.NVarChar(700), x.shortDescription || null).input('img', sql.NVarChar(500), x.thumbnail || null).input('f', sql.Bit, !!x.featured).input('s', sql.VarChar(20), x.status || 'ACTIVE');
    let pid = id;
    if (id) await rq.query('UPDATE Products SET ProductName=@n,SKU=@sku,CategoryID=@c,BrandID=@b,Price=@price,DiscountPrice=@dp,Description=@d,ShortDescription=@sd,Thumbnail=@img,Featured=@f,Status=@s,UpdatedAt=SYSDATETIME() WHERE ProductID=@id');else {
      rq.input('slug', sql.VarChar(240), slugify(x.productName, {
        lower: true,
        strict: true,
        locale: 'vi'
      }).slice(0, 190) + '-' + require('crypto').randomBytes(5).toString('hex'));
      pid = (await rq.query('INSERT INTO Products(ProductName,SKU,CategoryID,BrandID,Price,DiscountPrice,Description,ShortDescription,Thumbnail,Featured,Status,Slug) OUTPUT INSERTED.ProductID VALUES(@n,@sku,@c,@b,@price,@dp,@d,@sd,@img,@f,@s,@slug)')).recordset[0].ProductID;
      await request(tx).input('p', sql.Int, pid).input('q', sql.Int, Number(x.stock || 0)).query('INSERT INTO Inventory(ProductID,Quantity) VALUES(@p,@q)');
      if (Number(x.stock) > 0) await request(tx).input('p', sql.Int, pid).input('q', sql.Int, Number(x.stock)).input('u', sql.Int, r.user.userID).query("INSERT INTO InventoryTransactions(ProductID,Type,Quantity,BeforeQuantity,AfterQuantity,Note,CreatedBy) VALUES(@p,'IMPORT',@q,0,@q,N'Tồn đầu khi tạo sản phẩm',@u)");
    }
    await request(tx).input('p', sql.Int, pid).query('DELETE FROM ProductSpecifications WHERE ProductID=@p; DELETE FROM ProductImages WHERE ProductID=@p;');
    for (const [i, s] of x.specifications.entries()) await request(tx).input('p', sql.Int, pid).input('n', sql.NVarChar(120), s.name.trim()).input('v', sql.NVarChar(500), s.value.trim()).input('i', sql.Int, i).query('INSERT INTO ProductSpecifications(ProductID,SpecName,SpecValue,SortOrder) VALUES(@p,@n,@v,@i)');
    for (const [i, url] of x.images.entries()) await request(tx).input('p', sql.Int, pid).input('url', sql.NVarChar(500), url).input('i', sql.Int, i).query('INSERT INTO ProductImages(ProductID,ImageUrl,SortOrder,IsPrimary) VALUES(@p,@url,@i,CASE WHEN @i=0 THEN 1 ELSE 0 END)');
    return {
      productID: pid
    };
  });
}
router.post('/products', admin, handler(save));
router.put('/products/:id', admin, handler(save));
module.exports = router;
