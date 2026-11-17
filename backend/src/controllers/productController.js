const productService = require("../services/productService");
const { sql, getPool } = require("../config/database");
const { ok, fail } = require("../utils/apiResponse");
exports.list = async (req, res, next) => {
  try {
    const r = await productService.list(req.query);
    return res.json({
      success: true,
      message: "Thành công",
      data: r.data,
      pagination: r.pagination,
    });
  } catch (e) {
    next(e);
  }
};
exports.detail = async (req, res, next) => {
  try {
    const p = await productService.detail(req.params.idOrSlug);
    if (!p) return fail(res, "Không tìm thấy sản phẩm", 404);
    if (req.user?.userID) {
      const pool = await getPool();
      pool
        .request()
        .input("u", sql.Int, req.user.userID)
        .input("p", sql.Int, p.ProductID)
        .query("INSERT INTO ProductViews(UserID,ProductID) VALUES(@u,@p)")
        .catch(() => {});
    }
    return ok(res, p);
  } catch (e) {
    next(e);
  }
};
exports.featured = async (_req, res, next) => {
  try {
    const r = await productService.list({
      featured: true,
      sort: "best_selling",
      limit: 8,
    });
    return ok(res, r.data);
  } catch (e) {
    next(e);
  }
};
