const {
  sql,
  getPool
} = require('../config/database');
function productSelect() {
  return `SELECT p.ProductID,p.ProductName,p.Slug,p.Description,p.ShortDescription,p.Price,p.DiscountPrice,p.SKU,p.Thumbnail,p.Status,p.Featured,p.SoldCount,p.AverageRating,p.CreatedAt,
  c.CategoryID,c.CategoryName,c.Slug CategorySlug,b.BrandID,b.BrandName,b.Slug BrandSlug,
  i.Quantity StockQuantity,COALESCE(p.DiscountPrice,p.Price) EffectivePrice
  FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID`;
}
exports.list = async (q = {}) => {
  const pool = await getPool();
  const page = Math.max(1, parseInt(q.page || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(q.limit || '12', 10)));
  const offset = (page - 1) * limit;
  if (!Number.isFinite(page) || !Number.isFinite(limit)) throw Object.assign(new Error('Phân trang không hợp lệ'), {
    status: 400
  });
  const where = ["p.Status='ACTIVE'", "c.Status='ACTIVE'", "b.Status='ACTIVE'"];
  const binds = [];
  const bind = (name, type, value) => binds.push([name, type, value]);
  if (q.search) {
    where.push(`(p.ProductName LIKE @search OR p.SKU LIKE @search OR b.BrandName LIKE @search OR c.CategoryName LIKE @search OR EXISTS(SELECT 1 FROM ProductSpecifications ps WHERE ps.ProductID=p.ProductID AND (ps.SpecName LIKE @search OR ps.SpecValue LIKE @search)))`);
    bind('search', sql.NVarChar(250), `%${q.search}%`);
  }
  if (q.category) {
    where.push(`(c.Slug=@category OR CAST(c.CategoryID AS VARCHAR(20))=@category)`);
    bind('category', sql.VarChar(140), String(q.category));
  }
  if (q.brand) {
    where.push(`(b.Slug=@brand OR CAST(b.BrandID AS VARCHAR(20))=@brand)`);
    bind('brand', sql.VarChar(140), String(q.brand));
  }
  if (q.minPrice) {
    where.push(`COALESCE(p.DiscountPrice,p.Price)>=@minPrice`);
    bind('minPrice', sql.Decimal(18, 2), Number(q.minPrice));
  }
  if (q.maxPrice) {
    where.push(`COALESCE(p.DiscountPrice,p.Price)<=@maxPrice`);
    bind('maxPrice', sql.Decimal(18, 2), Number(q.maxPrice));
  }
  if (q.rating) {
    where.push(`p.AverageRating>=@rating`);
    bind('rating', sql.Decimal(3, 2), Number(q.rating));
  }
  if (String(q.inStock) === 'true') where.push(`ISNULL(i.Quantity,0)>0`);
  if (String(q.featured) === 'true') where.push(`p.Featured=1`);
  const sorts = {
    price_asc: 'EffectivePrice ASC',
    price_desc: 'EffectivePrice DESC',
    newest: 'p.CreatedAt DESC',
    best_selling: 'p.SoldCount DESC',
    rating: 'p.AverageRating DESC'
  };
  const order = sorts[q.sort] || 'p.Featured DESC,p.CreatedAt DESC';
  const wh = `WHERE ${where.join(' AND ')}`;
  const makeReq = () => {
    const r = pool.request();
    for (const [n, t, v] of binds) r.input(n, t, v);
    return r;
  };
  const total = (await makeReq().query(`SELECT COUNT(*) Total FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID ${wh}`)).recordset[0].Total;
  const req = makeReq();
  req.input('offset', sql.Int, offset).input('limit', sql.Int, limit);
  const data = (await req.query(`${productSelect()} ${wh} ORDER BY ${order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`)).recordset;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};
exports.detail = async identifier => {
  const pool = await getPool();
  const req = pool.request();
  const numeric = /^\d+$/.test(String(identifier));
  if (numeric) req.input('id', sql.Int, Number(identifier));else req.input('slug', sql.VarChar(240), identifier);
  const r = await req.query(`${productSelect()} WHERE p.${numeric ? 'ProductID=@id' : 'Slug=@slug'} AND p.Status='ACTIVE' AND c.Status='ACTIVE' AND b.Status='ACTIVE'`);
  const product = r.recordset[0];
  if (!product) return null;
  const extras = await Promise.all([pool.request().input('id', sql.Int, product.ProductID).query('SELECT * FROM ProductImages WHERE ProductID=@id ORDER BY IsPrimary DESC,SortOrder'), pool.request().input('id', sql.Int, product.ProductID).query('SELECT SpecificationID,SpecName,SpecValue,SortOrder FROM ProductSpecifications WHERE ProductID=@id ORDER BY SortOrder,SpecificationID'), pool.request().input('id', sql.Int, product.ProductID).query(`SELECT TOP 20 rv.ReviewID,rv.Rating,rv.Comment,rv.CreatedAt,u.FullName FROM Reviews rv JOIN Users u ON u.UserID=rv.UserID WHERE rv.ProductID=@id AND rv.Status='APPROVED' ORDER BY rv.CreatedAt DESC`)]);
  product.images = extras[0].recordset;
  product.specifications = extras[1].recordset;
  product.reviews = extras[2].recordset;
  return product;
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const { sql, getPool } = require('../config/database');
// 
// function productSelect() {
//   return `SELECT p.ProductID,p.ProductName,p.Slug,p.Description,p.ShortDescription,p.Price,p.DiscountPrice,p.SKU,p.Thumbnail,p.Status,p.Featured,p.SoldCount,p.AverageRating,p.CreatedAt,
//   c.CategoryID,c.CategoryName,c.Slug CategorySlug,b.BrandID,b.BrandName,b.Slug BrandSlug,
//   i.Quantity StockQuantity,COALESCE(p.DiscountPrice,p.Price) EffectivePrice
//   FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID`;
// }
// 
// exports.list = async (q={}) => {
//   const pool=await getPool();
//   const page=Math.max(1,parseInt(q.page||'1',10)); const limit=Math.min(50,Math.max(1,parseInt(q.limit||'12',10))); const offset=(page-1)*limit;
//   const where=["p.Status='ACTIVE'","c.Status='ACTIVE'","b.Status='ACTIVE'"]; const binds=[];
//   const bind=(name,type,value)=>binds.push([name,type,value]);
//   if(q.search){where.push(`(p.ProductName LIKE @search OR p.SKU LIKE @search OR b.BrandName LIKE @search OR c.CategoryName LIKE @search OR EXISTS(SELECT 1 FROM ProductSpecifications ps WHERE ps.ProductID=p.ProductID AND (ps.SpecName LIKE @search OR ps.SpecValue LIKE @search)))`);bind('search',sql.NVarChar(250),`%${q.search}%`)}
//   if(q.category){where.push(`(c.Slug=@category OR CAST(c.CategoryID AS VARCHAR(20))=@category)`);bind('category',sql.VarChar(140),String(q.category))}
//   if(q.brand){where.push(`(b.Slug=@brand OR CAST(b.BrandID AS VARCHAR(20))=@brand)`);bind('brand',sql.VarChar(140),String(q.brand))}
//   if(q.minPrice){where.push(`COALESCE(p.DiscountPrice,p.Price)>=@minPrice`);bind('minPrice',sql.Decimal(18,2),Number(q.minPrice))}
//   if(q.maxPrice){where.push(`COALESCE(p.DiscountPrice,p.Price)<=@maxPrice`);bind('maxPrice',sql.Decimal(18,2),Number(q.maxPrice))}
//   if(q.rating){where.push(`p.AverageRating>=@rating`);bind('rating',sql.Decimal(3,2),Number(q.rating))}
//   if(String(q.inStock)==='true') where.push(`ISNULL(i.Quantity,0)>0`);
//   if(String(q.featured)==='true') where.push(`p.Featured=1`);
//   const sorts={price_asc:'EffectivePrice ASC',price_desc:'EffectivePrice DESC',newest:'p.CreatedAt DESC',best_selling:'p.SoldCount DESC',rating:'p.AverageRating DESC'};
//   const order=sorts[q.sort]||'p.Featured DESC,p.CreatedAt DESC'; const wh=`WHERE ${where.join(' AND ')}`;
//   const makeReq=()=>{const r=pool.request();for(const [n,t,v] of binds)r.input(n,t,v);return r};
//   const total=(await makeReq().query(`SELECT COUNT(*) Total FROM Products p JOIN Categories c ON c.CategoryID=p.CategoryID JOIN Brands b ON b.BrandID=p.BrandID LEFT JOIN Inventory i ON i.ProductID=p.ProductID ${wh}`)).recordset[0].Total;
//   const req=makeReq();req.input('offset',sql.Int,offset).input('limit',sql.Int,limit);
//   const data=(await req.query(`${productSelect()} ${wh} ORDER BY ${order} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`)).recordset;
//   return {data,pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}};
// };
// 
// exports.detail = async (identifier) => {
//   const pool=await getPool(); const req=pool.request();
//   const numeric=/^\d+$/.test(String(identifier));
//   if(numeric) req.input('id',sql.Int,Number(identifier)); else req.input('slug',sql.VarChar(240),identifier);
//   const r=await req.query(`${productSelect()} WHERE p.${numeric?'ProductID=@id':'Slug=@slug'} AND p.Status='ACTIVE'`); const product=r.recordset[0]; if(!product)return null;
//   const extras=await Promise.all([
//     pool.request().input('id',sql.Int,product.ProductID).query('SELECT * FROM ProductImages WHERE ProductID=@id ORDER BY IsPrimary DESC,SortOrder'),
//     pool.request().input('id',sql.Int,product.ProductID).query('SELECT SpecificationID,SpecName,SpecValue,SortOrder FROM ProductSpecifications WHERE ProductID=@id ORDER BY SortOrder,SpecificationID'),
//     pool.request().input('id',sql.Int,product.ProductID).query(`SELECT TOP 20 rv.ReviewID,rv.Rating,rv.Comment,rv.CreatedAt,u.FullName FROM Reviews rv JOIN Users u ON u.UserID=rv.UserID WHERE rv.ProductID=@id AND rv.Status='APPROVED' ORDER BY rv.CreatedAt DESC`)
//   ]);
//   product.images=extras[0].recordset; product.specifications=extras[1].recordset; product.reviews=extras[2].recordset; return product;
// };
// 
// ===== HET MA CU =====
