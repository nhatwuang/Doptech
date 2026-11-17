const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sql,
  getPool
} = require("../config/database");
const {
  ok,
  fail
} = require("../utils/apiResponse");
exports.register = async (req, res, next) => {
  let tx;
  try {
    const {
      fullName,
      email,
      password,
      phone
    } = req.body;
    const pool = await getPool();
    if ((await pool.request().input("email", sql.VarChar(160), email).query("SELECT 1 x FROM Users WHERE Email=@email")).recordset.length) return fail(res, "Email đã tồn tại", 409);
    const hash = await bcrypt.hash(password, 10);
    tx = new sql.Transaction(pool);
    await tx.begin();
    const user = await new sql.Request(tx).input("name", sql.NVarChar(120), fullName).input("email", sql.VarChar(160), email).input("phone", sql.VarChar(20), phone || null).input("hash", sql.VarChar(255), hash).query(`INSERT INTO Users(RoleID,FullName,Email,Phone,PasswordHash) OUTPUT INSERTED.UserID VALUES((SELECT RoleID FROM Roles WHERE RoleName='CUSTOMER'),@name,@email,@phone,@hash)`);
    const id = user.recordset[0].UserID;
    await new sql.Request(tx).input("id", sql.Int, id).query("INSERT INTO Customers(UserID) VALUES(@id); INSERT INTO Carts(UserID) VALUES(@id); INSERT INTO Wishlists(UserID) VALUES(@id);");
    await tx.commit();
    return ok(res, {
      userID: id,
      email
    }, "Đăng ký thành công", 201);
  } catch (e) {
    if (tx) try {
      await tx.rollback();
    } catch (_) {}
    next(e);
  }
};
exports.login = async (req, res, next) => {
  try {
    const pool = await getPool();
    const {
      email,
      password
    } = req.body;
    const r = await pool.request().input("email", sql.VarChar(160), email).query(`SELECT u.UserID,u.FullName,u.Email,u.Phone,u.PasswordHash,u.Status,u.TokenVersion,r.RoleName FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.Email=@email`);
    const user = r.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) return fail(res, "Email hoặc mật khẩu không đúng", 401);
    if (user.Status !== "ACTIVE") return fail(res, "Tài khoản đang bị khóa hoặc ngừng hoạt động", 403);
    const token = jwt.sign({
      userID: user.UserID,
      role: user.RoleName,
      email: user.Email,
      version: user.TokenVersion
    }, require('../config/security').jwtSecret(), {
      expiresIn: "7d"
    });
    delete user.PasswordHash;
    user.role = user.RoleName;
    delete user.RoleName;
    return ok(res, {
      token,
      user
    }, "Đăng nhập thành công");
  } catch (e) {
    next(e);
  }
};
exports.me = async (req, res, next) => {
  try {
    const p = await getPool();
    const r = await p.request().input("id", sql.Int, req.user.userID).query(`SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Avatar,u.Status,r.RoleName role FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE u.UserID=@id`);
    return ok(res, r.recordset[0] || null);
  } catch (e) {
    next(e);
  }
};
exports.logout = async (req, res, next) => {
  try {
    const p = await getPool();
    await p.request().input('u', sql.Int, req.user.userID).query('UPDATE Users SET TokenVersion=TokenVersion+1 WHERE UserID=@u');
    return ok(res, null, 'Đã đăng xuất các phiên hiện tại');
  } catch (e) {
    next(e);
  }
};

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const { sql, getPool } = require("../config/database");
// const { ok, fail } = require("../utils/apiResponse");
// 
// exports.register = async (req, res, next) => {
//   let tx;
//   try {
//     const { fullName, email, password, phone } = req.body;
//     const pool = await getPool();
//     if (
//       (
//         await pool
//           .request()
//           .input("email", sql.VarChar(160), email)
//           .query("SELECT 1 x FROM Users WHERE Email=@email")
//       ).recordset.length
//     )
//       return fail(res, "Email đã tồn tại", 409);
//     const hash = await bcrypt.hash(password, 10);
//     tx = new sql.Transaction(pool);
//     await tx.begin();
//     const user = await new sql.Request(tx)
//       .input("name", sql.NVarChar(120), fullName)
//       .input("email", sql.VarChar(160), email)
//       .input("phone", sql.VarChar(20), phone || null)
//       .input("hash", sql.VarChar(255), hash)
//       .query(
//         `INSERT INTO Users(RoleID,FullName,Email,Phone,PasswordHash) OUTPUT INSERTED.UserID VALUES((SELECT RoleID FROM Roles WHERE RoleName='CUSTOMER'),@name,@email,@phone,@hash)`,
//       );
//     const id = user.recordset[0].UserID;
//     await new sql.Request(tx)
//       .input("id", sql.Int, id)
//       .query(
//         "INSERT INTO Customers(UserID) VALUES(@id); INSERT INTO Carts(UserID) VALUES(@id); INSERT INTO Wishlists(UserID) VALUES(@id);",
//       );
//     await tx.commit();
//     return ok(res, { userID: id, email }, "Đăng ký thành công", 201);
//   } catch (e) {
//     if (tx)
//       try {
//         await tx.rollback();
//       } catch (_) {}
//     next(e);
//   }
// };
// 
// exports.login = async (req, res, next) => {
//   try {
//     const pool = await getPool();
//     const { email, password } = req.body;
//     const r = await pool
//       .request()
//       .input("email", sql.VarChar(160), email)
//       .query(
//         `SELECT u.UserID,u.FullName,u.Email,u.Phone,u.PasswordHash,u.Status,r.RoleName FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.Email=@email`,
//       );
//     const user = r.recordset[0];
//     if (!user || !(await bcrypt.compare(password, user.PasswordHash)))
//       return fail(res, "Email hoặc mật khẩu không đúng", 401);
//     if (user.Status !== "ACTIVE")
//       return fail(res, "Tài khoản đang bị khóa hoặc ngừng hoạt động", 403);
//     const token = jwt.sign(
//       { userID: user.UserID, role: user.RoleName, email: user.Email },
//       process.env.JWT_SECRET || "doptech_secret_key_change_me",
//       { expiresIn: "7d" },
//     );
//     delete user.PasswordHash;
//     user.role = user.RoleName;
//     delete user.RoleName;
//     return ok(res, { token, user }, "Đăng nhập thành công");
//   } catch (e) {
//     next(e);
//   }
// };
// exports.me = async (req, res, next) => {
//   try {
//     const p = await getPool();
//     const r = await p
//       .request()
//       .input("id", sql.Int, req.user.userID)
//       .query(
//         `SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Avatar,u.Status,r.RoleName role FROM Users u JOIN Roles r ON r.RoleID=u.RoleID WHERE u.UserID=@id`,
//       );
//     return ok(res, r.recordset[0] || null);
//   } catch (e) {
//     next(e);
//   }
// };
// exports.logout = async (_req, res) => ok(res, null, "Đăng xuất thành công");
// 
// ===== HET MA CU =====
