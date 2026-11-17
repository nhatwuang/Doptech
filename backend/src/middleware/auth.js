const jwt = require('jsonwebtoken');
const {
  sql,
  getPool
} = require('../config/database');
const {
  fail
} = require('../utils/apiResponse');
const {
  jwtSecret
} = require('../config/security');
async function authenticateToken(req, res, next) {
  const token = (req.headers.authorization || '').startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  if (!token) return fail(res, 'Bạn cần đăng nhập', 401);
  let claims;
  try {
    claims = jwt.verify(token, jwtSecret(), {
      algorithms: ['HS256']
    });
  } catch (_) {
    return fail(res, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn', 401);
  }
  try {
    const p = await getPool();
    const user = (await p.request().input('id', sql.Int, claims.userID).query('SELECT u.UserID,u.Email,u.Status,u.TokenVersion,r.RoleName FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE u.UserID=@id')).recordset[0];
    if (!user || user.Status !== 'ACTIVE' || claims.version !== user.TokenVersion) return fail(res, 'Phiên đã bị thu hồi. Vui lòng đăng nhập lại.', 401);
    req.user = {
      userID: user.UserID,
      email: user.Email,
      role: user.RoleName
    };
    next();
  } catch (e) {
    next(e);
  }
}
function optionalAuth(req, res, next) {
  return req.headers.authorization ? authenticateToken(req, res, next) : next();
}
function authorizeRoles(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : fail(res, 'Bạn không có quyền thực hiện thao tác này', 403);
}
module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const jwt = require("jsonwebtoken");
// const { fail } = require("../utils/apiResponse");
// 
// function authenticateToken(req, res, next) {
//   const value = req.headers.authorization || "";
//   const token = value.startsWith("Bearer ") ? value.slice(7) : null;
//   if (!token) return fail(res, "Bạn cần đăng nhập", 401);
//   try {
//     req.user = jwt.verify(
//       token,
//       process.env.JWT_SECRET || "doptech_secret_key_change_me",
//     );
//     next();
//   } catch (_) {
//     return fail(res, "Token không hợp lệ hoặc đã hết hạn", 401);
//   }
// }
// function optionalAuth(req, _res, next) {
//   const value = req.headers.authorization || "";
//   const token = value.startsWith("Bearer ") ? value.slice(7) : null;
//   if (token) {
//     try {
//       req.user = jwt.verify(
//         token,
//         process.env.JWT_SECRET || "doptech_secret_key_change_me",
//       );
//     } catch (_) {}
//   }
//   next();
// }
// function authorizeRoles(...roles) {
//   return (req, res, next) =>
//     roles.includes(req.user?.role)
//       ? next()
//       : fail(res, "Bạn không có quyền thực hiện thao tác này", 403);
// }
// module.exports = { authenticateToken, optionalAuth, authorizeRoles };
// 
// ===== HET MA CU =====
