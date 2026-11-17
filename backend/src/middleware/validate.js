const { validationResult } = require('express-validator');
const { fail } = require('../utils/apiResponse');
module.exports = (req,res,next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return fail(res, 'Dữ liệu không hợp lệ', 400, result.array());
  next();
};
