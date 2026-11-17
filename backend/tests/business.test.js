const test = require('node:test');
const assert = require('node:assert/strict');
const {
  transition,
  payable,
  checkoutInput,
  positiveInt
} = require('../src/utils/businessRules');
const {
  analyze,
  rank,
  specsOf
} = require('../src/ai/recommender');
test('Đơn chỉ tiến từng bước; hủy chỉ trước đóng gói', () => {
  for (const [a, b] of [['PENDING', 'CONFIRMED'], ['CONFIRMED', 'PACKING'], ['PACKING', 'SHIPPING'], ['SHIPPING', 'COMPLETED'], ['PENDING', 'CANCELLED'], ['CONFIRMED', 'CANCELLED']]) assert.equal(transition(a, b), true);
  for (const [a, b] of [['PENDING', 'COMPLETED'], ['SHIPPING', 'CANCELLED'], ['CANCELLED', 'CONFIRMED'], ['COMPLETED', 'PENDING']]) assert.throws(() => transition(a, b));
  assert.equal(transition('CANCELLED', 'CANCELLED'), false);
});
test('Không thanh toán đơn hủy hoặc thanh toán hoàn tiền; trả lại thành công khi đã trả', () => {
  assert.throws(() => payable({
    Status: 'CANCELLED'
  }, {
    Status: 'PENDING',
    Method: 'MOMO'
  }));
  assert.throws(() => payable({
    Status: 'PENDING'
  }, {
    Status: 'REFUNDED',
    Method: 'MOMO'
  }));
  assert.throws(() => payable({
    Status: 'PENDING'
  }, {
    Status: 'PENDING',
    Method: 'COD'
  }));
  assert.equal(payable({
    Status: 'PENDING'
  }, {
    Status: 'PAID',
    Method: 'MOMO'
  }), false);
  assert.equal(payable({
    Status: 'PENDING'
  }, {
    Status: 'PENDING',
    Method: 'MOMO'
  }), true);
});
test('Số lượng phải nguyên, dương và nằm trong phạm vi SQL INT', () => {
  for (const n of [0, -1, 1.5, 'abc', Infinity, 2147483648]) assert.throws(() => positiveInt(n));
  assert.equal(positiveInt('3'), 3);
});
test('Checkout từ chối dữ liệu nhận hàng và phương thức giả', () => {
  const x = {
    receiverName: 'Nguyễn A',
    receiverPhone: '0901234567',
    receiverEmail: 'a@example.com',
    shippingAddress: '12 Nguyễn Trãi',
    shippingMethod: 'STANDARD',
    paymentMethod: 'COD'
  };
  assert.equal(checkoutInput({
    ...x
  }).paymentMethod, 'COD');
  for (const part of [{
    receiverPhone: 'abc'
  }, {
    receiverEmail: 'x'
  }, {
    shippingAddress: ' '
  }, {
    paymentMethod: 'FREE'
  }, {
    shippingMethod: 'EXPRESS_FREE'
  }]) assert.throws(() => checkoutInput({
    ...x,
    ...part
  }));
});
test('AI hiểu máy tính RAM là máy tính; phân biệt mua RAM', () => {
  assert.equal(analyze('máy tính RAM 16GB').category, 'laptop');
  assert.equal(analyze('RAM 16GB').category, 'ram');
});
test('AI giữ ngân sách ở câu tiếp theo và thay ngân sách khi người dùng đổi', () => {
  const a = analyze('Laptop dưới 20 triệu RAM 16GB');
  const b = analyze('Có mẫu nhẹ hơn không?', a);
  assert.equal(b.budget, 20000000);
  assert.equal(b.ramGB, 16);
  assert.equal(b.preferLight, true);
  assert.equal(analyze('Tăng lên 25 triệu', b).budget, 25000000);
  assert.equal(analyze('điện thoại dưới 10 triệu', b).ramGB, null);
});
test('AI không bỏ RAM/SSD/ngân sách khi không có kết quả', () => {
  const p = {
    ProductName: 'Laptop A',
    CategorySlug: 'laptop',
    EffectivePrice: 15000000,
    Specifications: JSON.stringify([{
      SpecName: 'RAM',
      SpecValue: '8 GB'
    }, {
      SpecName: 'SSD',
      SpecValue: '512 GB'
    }])
  };
  assert.equal(rank([p], analyze('laptop dưới 20 triệu RAM 16GB')).length, 0);
  assert.equal(rank([p], analyze('laptop dưới 10 triệu')).length, 0);
  assert.equal(rank([p], analyze('laptop SSD 1TB')).length, 0);
  assert.equal(rank([p], analyze('laptop dưới 20 triệu RAM 8GB')).length, 1);
});
test('Thông số chuẩn hóa TB, GB và gram', () => {
  assert.deepEqual(specsOf({
    specifications: [{
      name: 'SSD',
      value: '1 TB'
    }, {
      name: 'Trọng lượng',
      value: '1500 g'
    }]
  }), {
    ssdGB: 1024,
    weight: 1.5
  });
});
