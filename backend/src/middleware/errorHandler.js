const {
  fail
} = require('../utils/apiResponse');
function notFound(req, res) {
  return fail(res, `Không tìm thấy API ${req.method} ${req.originalUrl}`, 404);
}
function errorHandler(err, _req, res, _next) {
  if (process.env.NODE_ENV !== 'test') console.error('[DopTech Error]', err);
  if ([2601, 2627].includes(err.number)) return fail(res, 'Dữ liệu đã tồn tại (email, SKU hoặc đánh giá trùng).', 409);
  if (err.number === 547) return fail(res, 'Dữ liệu không thỏa điều kiện nghiệp vụ hoặc tham chiếu không hợp lệ.', 400);
  if (err.number === 1205) return fail(res, 'Dữ liệu đang được xử lý đồng thời. Vui lòng thử lại.', 409);
  const status = err.status || 500;
  return fail(res, status === 500 ? 'Lỗi máy chủ. Vui lòng thử lại.' : err.message, status);
}
module.exports = {
  notFound,
  errorHandler
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const { fail } = require('../utils/apiResponse');
// function notFound(req, res) { return fail(res, `Không tìm thấy API ${req.method} ${req.originalUrl}`, 404); }
// function errorHandler(err, _req, res, _next) {
//   console.error('[DopTech Error]', err);
//   const status = err.status || 500;
//   return fail(res, status === 500 ? 'Lỗi máy chủ. Vui lòng thử lại.' : err.message, status);
// }
// module.exports = { notFound, errorHandler };
// 
// ===== HET MA CU =====
