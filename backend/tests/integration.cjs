// Uses a newly created isolated database only. Never resets the configured DopTech database.
const fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  assert = require('node:assert/strict');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});
const testDB = 'DopTech_Test_' + Date.now();
process.env.DB_DATABASE = testDB;
process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
process.env.OPENAI_API_KEY = '';
process.env.NODE_ENV = 'test';
const {
  sql,
  baseConfig,
  getPool
} = require('../src/config/database');
const batches = s => s.split(/^\s*GO\s*$/gim).filter(x => x.trim() && !/^\s*(IF DB_ID|USE\s)/i.test(x));
let master,
  pool,
  server,
  created = false,
  passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log('PASS ' + name);
}
async function main() {
  master = await new sql.ConnectionPool({
    ...baseConfig,
    database: 'master'
  }).connect();
  if (!/^DopTech_Test_\d+$/.test(testDB)) throw new Error('Invalid test database');
  await master.request().query(`CREATE DATABASE [${testDB}]`);
  created = true;
  pool = await getPool();
  for (const name of ['schema.sql', 'seed.sql']) for (const b of batches(fs.readFileSync(path.join(__dirname, '..', 'database', name), 'utf8'))) await pool.request().batch(b);
  // Rerunnable migration must preserve data.
  for (const b of batches(fs.readFileSync(path.join(__dirname, '..', 'database/migrations/001_consistency.sql'), 'utf8'))) await pool.request().batch(b);
  const app = require('../src/app');
  server = await new Promise(resolve => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function api(route, method = 'GET', body, token) {
    const r = await fetch(base + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {
          Authorization: 'Bearer ' + token
        } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    return {
      status: r.status,
      ...(await r.json())
    };
  }
  const login = async (email, password) => {
    const r = await api('/auth/login', 'POST', {
      email,
      password
    });
    assert.equal(r.status, 200, JSON.stringify(r));
    return r.data;
  };
  const admin = await login('admin@doptech.local', 'Admin@123'),
    customer = await login('customer@doptech.local', 'Customer@123'),
    staff = await login('staff@doptech.local', 'Staff@123');
  const user = customer.user.UserID;
  const product = (await pool.request().query("SELECT TOP 1 p.ProductID,p.Price,COALESCE(p.DiscountPrice,p.Price) EffectivePrice FROM Products p JOIN Inventory i ON i.ProductID=p.ProductID WHERE p.Status='ACTIVE' AND i.Quantity>10 ORDER BY p.ProductID")).recordset[0];
  const pid = product.ProductID;
  const scalar = async q => Object.values((await pool.request().query(q)).recordset[0])[0];
  const stock = () => scalar(`SELECT Quantity FROM Inventory WHERE ProductID=${pid}`);
  async function cart(token = customer.token) {
    const c = await api('/cart', 'GET', undefined, token);
    for (const item of c.data.items) await api('/cart/items/' + item.CartItemID, 'DELETE', undefined, token);
    assert.equal((await api('/cart/items', 'POST', {
      productID: pid,
      quantity: 1
    }, token)).status, 201);
  }
  const payload = () => ({
    receiverName: 'Kiểm thử',
    receiverPhone: '0901234567',
    receiverEmail: 'test@example.com',
    shippingAddress: 'Địa chỉ kiểm thử',
    shippingMethod: 'STANDARD',
    paymentMethod: 'MOMO',
    requestKey: crypto.randomUUID()
  });
  let oid;
  await check('Checkout idempotent và chỉ trừ kho một lần', async () => {
    await cart();
    const before = await stock(),
      x = payload();
    const a = await api('/orders/checkout', 'POST', x, customer.token);
    assert.equal(a.status, 201, JSON.stringify(a));
    oid = a.data.orderID;
    const b = await api('/orders/checkout', 'POST', x, customer.token);
    assert.equal(b.data.orderID, oid);
    assert.equal(await stock(), before - 1);
  });
  await check('Không cho nhảy trạng thái', async () => {
    assert.equal((await api(`/admin/orders/${oid}/status`, 'PUT', {
      status: 'COMPLETED'
    }, admin.token)).status, 409);
  });
  await check('Thanh toán, hủy, hoàn kho đúng một lần; không trả lại sau hoàn tiền', async () => {
    assert.equal((await api(`/payments/order/${oid}/simulate-success`, 'POST', {}, customer.token)).status, 200);
    const before = await stock();
    assert.equal((await api(`/orders/${oid}/cancel`, 'POST', {}, customer.token)).status, 200);
    assert.equal((await api(`/orders/${oid}/cancel`, 'POST', {}, customer.token)).status, 200);
    assert.equal(await stock(), before + 1);
    assert.equal(await scalar(`SELECT Status FROM Payments WHERE OrderID=${oid}`), 'REFUNDED');
    assert.equal((await api(`/payments/order/${oid}/simulate-success`, 'POST', {}, customer.token)).status, 409);
  });
  await check('Hủy và xác nhận đồng thời giữ nhất quán', async () => {
    await cart();
    const r = await api('/orders/checkout', 'POST', payload(), customer.token),
      id = r.data.orderID,
      before = await stock();
    await Promise.all([api(`/orders/${id}/cancel`, 'POST', {}, customer.token), api(`/admin/orders/${id}/status`, 'PUT', {
      status: 'CONFIRMED'
    }, admin.token)]);
    assert.equal(await scalar(`SELECT Status FROM Orders WHERE OrderID=${id}`), 'CANCELLED');
    assert.equal(await stock(), before + 1);
  });
  await check('Chặn số lượng lẻ và tổng tiền sai', async () => {
    assert.equal((await api('/cart/items', 'POST', {
      productID: pid,
      quantity: 1.5
    }, customer.token)).status, 400);
    await cart();
    assert.equal((await api('/orders/checkout', 'POST', {
      ...payload(),
      expectedTotal: 1
    }, customer.token)).status, 409);
  });
  await check('Nhân viên không được xem doanh thu hoặc giảm kho', async () => {
    assert.equal((await api('/dashboard', 'GET', undefined, staff.token)).status, 403);
    assert.equal((await api(`/inventory/${pid}/adjust`, 'POST', {
      type: 'ADJUSTMENT',
      quantity: -1
    }, staff.token)).status, 403);
  });
  await check('Hoàn thành phải thanh toán; chọn 2 sao; ẩn đánh giá tính lại trung bình', async () => {
    await cart();
    const r = await api('/orders/checkout', 'POST', payload(), customer.token),
      id = r.data.orderID;
    for (const status of ['CONFIRMED', 'PACKING', 'SHIPPING']) assert.equal((await api(`/admin/orders/${id}/status`, 'PUT', {
      status
    }, admin.token)).status, 200);
    assert.equal((await api(`/admin/orders/${id}/status`, 'PUT', {
      status: 'COMPLETED'
    }, admin.token)).status, 409);
    await api(`/payments/order/${id}/simulate-success`, 'POST', {}, customer.token);
    assert.equal((await api(`/admin/orders/${id}/status`, 'PUT', {
      status: 'COMPLETED'
    }, admin.token)).status, 200);
    assert.equal((await api('/reviews', 'POST', {
      productID: pid,
      orderID: id,
      rating: 2,
      comment: 'Kiểm thử'
    }, customer.token)).status, 201);
    const rid = await scalar(`SELECT ReviewID FROM Reviews WHERE OrderID=${id} AND ProductID=${pid}`);
    assert.equal((await api(`/admin/reviews/${rid}/status`, 'PUT', {
      status: 'HIDDEN'
    }, admin.token)).status, 200);
    const ratings = (await pool.request().query(`SELECT AverageRating,(SELECT COALESCE(CAST(AVG(CAST(Rating AS DECIMAL(4,2))) AS DECIMAL(3,2)),0) FROM Reviews WHERE ProductID=${pid} AND Status='APPROVED') Expected FROM Products WHERE ProductID=${pid}`)).recordset[0];
    assert.equal(Number(ratings.AverageRating), Number(ratings.Expected));
    const order = await api('/orders/' + id, 'GET', undefined, customer.token);
    assert.equal(order.data.history.length, 5);
    assert.ok(order.data.CompletedAt);
  });
  await check('Tạo nhân viên và thu hồi token khi khóa hoặc đổi quyền', async () => {
    const email = 'newstaff@example.com';
    assert.equal((await api('/admin/staff', 'POST', {
      fullName: 'Nhân viên kiểm thử',
      email,
      password: 'Testing@123'
    }, admin.token)).status, 200);
    const u = await login(email, 'Testing@123');
    assert.equal((await api(`/admin/users/${u.user.UserID}/status`, 'PUT', {
      status: 'LOCKED'
    }, admin.token)).status, 200);
    assert.equal((await api('/auth/me', 'GET', undefined, u.token)).status, 401);
    await api(`/admin/users/${u.user.UserID}/status`, 'PUT', {
      status: 'ACTIVE'
    }, admin.token);
    const u2 = await login(email, 'Testing@123');
    await api(`/admin/users/${u.user.UserID}/role`, 'PUT', {
      role: 'CUSTOMER'
    }, admin.token);
    assert.equal((await api('/auth/me', 'GET', undefined, u2.token)).status, 401);
    assert.equal(await scalar(`SELECT COUNT(*) FROM Customers WHERE UserID=${u.user.UserID}`), 1);
    const u3 = await login(email, 'Testing@123');
    assert.equal((await api('/orders/' + oid, 'GET', undefined, u3.token)).status, 404);
  });
  await check('Sản phẩm lưu đầy đủ mô tả, thông số, ảnh và giá giảm bằng 0', async () => {
    const x = {
      productName: 'Laptop Test',
      sku: 'TEST-' + Date.now(),
      categoryID: 1,
      brandID: 1,
      price: 100,
      discountPrice: 0,
      stock: 2,
      thumbnail: 'https://example.com/a.png',
      description: 'Test',
      shortDescription: 'Test',
      status: 'ACTIVE',
      specifications: [{
        name: 'RAM',
        value: '16 GB'
      }],
      images: ['https://example.com/b.png']
    };
    const r = await api('/admin/products', 'POST', x, admin.token);
    assert.equal(r.status, 200, JSON.stringify(r));
    x.description = 'Updated';
    assert.equal((await api('/admin/products/' + r.data.productID, 'PUT', x, admin.token)).status, 200);
    const p = await api('/admin/products/' + r.data.productID, 'GET', undefined, admin.token);
    assert.equal(p.data.Description, 'Updated');
    assert.equal(p.data.DiscountPrice, 0);
    assert.equal(p.data.specifications[0].value, '16 GB');
  });
  await check('AI thực hiện lọc danh mục và giữ ngân sách qua hội thoại', async () => {
    const r = await api('/ai/chat', 'POST', {
      message: 'Có mẫu nhẹ hơn không?',
      history: ['Laptop dưới 20 triệu RAM 16GB']
    }, customer.token);
    assert.equal(r.status, 200, JSON.stringify(r));
    assert.equal(r.data.intent.budget, 20000000);
    for (const p of r.data.recommendedProducts) {
      assert.equal(p.CategorySlug, 'laptop');
      assert.ok(p.normalized.ramGB >= 16);
      assert.ok(Number(p.EffectivePrice) <= 20000000);
    }
  });
  await check('Hai khách tranh sản phẩm cuối chỉ tạo một đơn', async () => {
    const other = await login('newstaff@example.com', 'Testing@123');
    await cart();
    await cart(other.token);
    const before = await stock();
    await pool.request().query('UPDATE Inventory SET Quantity=1,ReservedQuantity=0 WHERE ProductID=' + pid);
    const results = await Promise.all([api('/orders/checkout', 'POST', payload(), customer.token), api('/orders/checkout', 'POST', payload(), other.token)]);
    assert.equal(results.filter(r => r.status === 201).length, 1, JSON.stringify(results));
    assert.equal(await stock(), 0);
    await pool.request().query('UPDATE Inventory SET Quantity=' + before + ' WHERE ProductID=' + pid);
  });
  await check('Hai khách tranh lượt voucher cuối; chỉ dùng một lần', async () => {
    const other = await login('newstaff@example.com', 'Testing@123');
    await cart();
    await cart(other.token);
    await pool.request().query("INSERT INTO Coupons(Code,DiscountType,DiscountValue,StartDate,EndDate,UsageLimit) VALUES('TESTLAST','FIXED',1000,DATEADD(DAY,-1,GETDATE()),DATEADD(DAY,1,GETDATE()),1)");
    const results = await Promise.all([api('/orders/checkout', 'POST', {
      ...payload(),
      couponCode: 'TESTLAST'
    }, customer.token), api('/orders/checkout', 'POST', {
      ...payload(),
      couponCode: 'TESTLAST'
    }, other.token)]);
    assert.equal(results.filter(r => r.status === 201).length, 1, JSON.stringify(results));
    assert.equal(await scalar("SELECT UsedCount FROM Coupons WHERE Code='TESTLAST'"), 1);
  });
  await check('Đăng xuất thu hồi token', async () => {
    assert.equal((await api('/auth/logout', 'POST', {}, customer.token)).status, 200);
    assert.equal((await api('/auth/me', 'GET', undefined, customer.token)).status, 401);
  });
  console.log(`INTEGRATION PASSED: ${passed}`);
}
main().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
}).finally(async () => {
  if (server) await new Promise(r => server.close(r));
  if (pool) await pool.close();
  if (master) {
    if (created && /^DopTech_Test_\d+$/.test(testDB)) await master.request().query(`ALTER DATABASE [${testDB}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${testDB}]`).catch(e => console.error('Test database retained:', testDB, e.code));
    await master.close();
  }
});
