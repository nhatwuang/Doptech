const router = require('express').Router();
const bcrypt = require('bcrypt');
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
async function profiles(tx, id, role) {
  const r = request(tx).input('u', sql.Int, id);
  if (role === 'STAFF') await r.query("IF NOT EXISTS(SELECT 1 FROM Staff WHERE UserID=@u) INSERT INTO Staff(UserID,StaffCode,Position,HireDate) VALUES(@u,CONCAT('NV-',@u),N'Nhân viên',CAST(GETDATE() AS DATE))");
  if (role === 'CUSTOMER') await r.query('IF NOT EXISTS(SELECT 1 FROM Customers WHERE UserID=@u) INSERT INTO Customers(UserID) VALUES(@u); IF NOT EXISTS(SELECT 1 FROM Carts WHERE UserID=@u) INSERT INTO Carts(UserID) VALUES(@u); IF NOT EXISTS(SELECT 1 FROM Wishlists WHERE UserID=@u) INSERT INTO Wishlists(UserID) VALUES(@u);');
}
router.get('/staff', admin, handler(async () => {
  const p = await getPool();
  return (await p.request().query("SELECT u.UserID,u.FullName,u.Email,u.Phone,u.Status,r.RoleName,s.StaffCode,s.Position,s.HireDate FROM Users u JOIN Roles r ON r.RoleID=u.RoleID LEFT JOIN Staff s ON s.UserID=u.UserID WHERE r.RoleName IN ('STAFF','ADMIN') ORDER BY u.UserID")).recordset;
}));
router.post('/staff', admin, handler(async r => {
  const x = r.body;
  if (typeof x.fullName !== 'string' || !x.fullName.trim() || x.fullName.length > 120 || typeof x.email !== 'string' || x.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email) || typeof x.password !== 'string' || x.password.length < 8 || Buffer.byteLength(x.password) > 72) throw error('Họ tên, email hoặc mật khẩu không hợp lệ (mật khẩu ít nhất 8 ký tự, tối đa 72 byte)');
  const hash = await bcrypt.hash(x.password, 10);
  return transaction(async tx => {
    const u = (await request(tx).input('n', sql.NVarChar(120), x.fullName.trim()).input('e', sql.VarChar(160), x.email.trim().toLowerCase()).input('h', sql.VarChar(255), hash).query("INSERT INTO Users(RoleID,FullName,Email,PasswordHash) OUTPUT INSERTED.UserID VALUES((SELECT RoleID FROM Roles WHERE RoleName='STAFF'),@n,@e,@h)")).recordset[0];
    await profiles(tx, u.UserID, 'STAFF');
    return u;
  });
}));
for (const field of ['status', 'role']) router.put(`/users/:id/${field}`, admin, handler(async r => {
  const id = positiveInt(r.params.id),
    value = r.body[field];
  if (!(field === 'status' ? ['ACTIVE', 'INACTIVE', 'LOCKED'] : ['CUSTOMER', 'STAFF', 'ADMIN']).includes(value)) throw error('Giá trị không hợp lệ');
  if (id === r.user.userID) throw error('Không được tự khóa hoặc thay đổi quyền tài khoản đang sử dụng', 409);
  return transaction(async tx => {
    const admins = (await request(tx).query("SELECT u.UserID FROM Users u WITH(UPDLOCK,HOLDLOCK) JOIN Roles r ON r.RoleID=u.RoleID WHERE r.RoleName='ADMIN' AND u.Status='ACTIVE'")).recordset;
    const current = (await request(tx).input('id', sql.Int, id).query('SELECT UserID FROM Users WITH(UPDLOCK,HOLDLOCK) WHERE UserID=@id')).recordset[0];
    if (!current) throw error('Không tìm thấy tài khoản', 404);
    if (admins.length === 1 && admins[0].UserID === id && (field === 'role' && value !== 'ADMIN' || field === 'status' && value !== 'ACTIVE')) throw error('Phải giữ ít nhất một quản trị viên đang hoạt động', 409);
    const query = field === 'status' ? 'UPDATE Users SET Status=@v,TokenVersion=TokenVersion+1,UpdatedAt=SYSDATETIME() WHERE UserID=@id' : 'UPDATE Users SET RoleID=(SELECT RoleID FROM Roles WHERE RoleName=@v),TokenVersion=TokenVersion+1,UpdatedAt=SYSDATETIME() WHERE UserID=@id';
    await request(tx).input('id', sql.Int, id).input('v', sql.VarChar(20), value).query(query);
    if (field === 'role') await profiles(tx, id, value);
    return {
      userID: id
    };
  });
}));
router.use(require('./productManagementRoutes'));
module.exports = router;
