const error = (message, status = 400) => Object.assign(new Error(message), {
  status
});
function positiveInt(value, label = 'ID') {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0 || n > 2147483647) throw error(`${label} phải là số nguyên dương`);
  return n;
}
function checkoutInput(x) {
  for (const [key, max] of [['receiverName', 120], ['receiverPhone', 20], ['receiverEmail', 160], ['shippingAddress', 500]]) {
    if (typeof x[key] !== 'string' || !x[key].trim() || x[key].length > max) throw error('Thông tin nhận hàng không hợp lệ');
    x[key] = x[key].trim();
  }
  if (!/^[+\d][\d\s().-]{7,19}$/.test(x.receiverPhone)) throw error('Số điện thoại không hợp lệ');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.receiverEmail)) throw error('Email không hợp lệ');
  if (!['STANDARD', 'EXPRESS'].includes(x.shippingMethod)) throw error('Phương thức vận chuyển không hợp lệ');
  if (!['COD', 'BANK_TRANSFER', 'VNPAY', 'MOMO'].includes(x.paymentMethod)) throw error('Phương thức thanh toán không hợp lệ');
  if (x.note != null && (typeof x.note !== 'string' || x.note.length > 500)) throw error('Ghi chú tối đa 500 ký tự');
  if (x.couponCode != null && (typeof x.couponCode !== 'string' || x.couponCode.length > 40)) throw error('Voucher không hợp lệ');
  if (x.requestKey != null && !/^[a-zA-Z0-9-]{16,80}$/.test(x.requestKey)) throw error('Mã yêu cầu không hợp lệ');
  return x;
}
const nextStatus = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PACKING',
  PACKING: 'SHIPPING',
  SHIPPING: 'COMPLETED'
};
function transition(from, to) {
  if (from === to) return false;
  if (to === 'CANCELLED' && ['PENDING', 'CONFIRMED'].includes(from)) return true;
  if (nextStatus[from] !== to) throw error('Không thể chuyển trạng thái đơn hàng này', 409);
  return true;
}
function payable(order, payment) {
  if (order.Status === 'CANCELLED' || payment.Status === 'REFUNDED') throw error('Đơn đã hủy hoặc đã hoàn tiền', 409);
  if (payment.Method === 'COD') throw error('COD được xác nhận khi hoàn thành đơn');
  if (payment.Status === 'PAID') return false;
  if (order.Status === 'COMPLETED' || payment.Status !== 'PENDING') throw error('Thanh toán không còn khả dụng', 409);
  return true;
}
module.exports = {
  error,
  positiveInt,
  checkoutInput,
  nextStatus,
  transition,
  payable
};
