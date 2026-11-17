import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { money } from '../utils/format';
export default function CheckoutPage() {
  const {
    cart,
    load
  } = useCart();
  const {
    user
  } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
      receiverName: user?.FullName || '',
      receiverPhone: user?.Phone || '',
      receiverEmail: user?.Email || '',
      shippingAddress: '',
      note: '',
      shippingMethod: 'STANDARD',
      paymentMethod: 'COD',
      couponCode: ''
    }),
    [discount, setDiscount] = useState(0),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get('/profile/addresses').then(r => {
      const d = r.data.data.find(x => x.IsDefault) || r.data.data[0];
      if (d) setForm(f => ({
        ...f,
        shippingAddress: [d.AddressLine, d.Ward, d.District, d.Province].filter(Boolean).join(', '),
        receiverName: d.ReceiverName,
        receiverPhone: d.ReceiverPhone
      }));
    }).catch(() => {});
  }, []);
  const keyRef = useRef(null);
  if (!keyRef.current) {
    keyRef.current = sessionStorage.getItem('doptech_checkout_key') || crypto.randomUUID();
    sessionStorage.setItem('doptech_checkout_key', keyRef.current);
  }
  const couponVersion = useRef(0);
  const [applied, setApplied] = useState('');
  useEffect(() => {
    couponVersion.current++;
    setDiscount(0);
    setApplied('');
  }, [form.couponCode, cart.subtotal]);
  const ship = form.shippingMethod === 'EXPRESS' ? 50000 : 30000;
  const total = Math.max(0, cart.subtotal - discount + ship);
  const apply = async () => {
    const version = ++couponVersion.current;
    const code = form.couponCode.trim();
    try {
      const r = await api.post('/coupons/validate', {
        code,
        subtotal: cart.subtotal
      });
      if (version !== couponVersion.current) return;
      setApplied(code);
      setDiscount(Number(r.data.data.discountAmount));
      alert(`Áp dụng voucher: -${money(r.data.data.discountAmount)}`);
    } catch (e) {
      if (version !== couponVersion.current) return;
      setApplied('');
      setDiscount(0);
      alert(e.response?.data?.message || 'Voucher không hợp lệ');
    }
  };
  const submit = async e => {
    e.preventDefault();
    if (!cart.items?.length) return alert('Giỏ hàng trống');
    if (form.couponCode.trim() !== applied) return alert('Vui lòng áp dụng voucher hoặc xóa mã trước khi đặt hàng.');
    setBusy(true);
    try {
      const r = await api.post('/orders/checkout', {
        ...form,
        couponCode: applied,
        expectedTotal: total,
        requestKey: keyRef.current
      });
      sessionStorage.removeItem('doptech_checkout_key');
      nav('/orders/' + r.data.data.orderID);
      load().catch(() => {});
    } catch (e) {
      alert(e.response?.data?.message || 'Không thể đặt hàng');
    } finally {
      setBusy(false);
    }
  };
  return <div className="container py-5"><h1 className="section-title mb-4">Thanh toán</h1><form onSubmit={submit}><div className="row g-4"><div className="col-lg-7"><div className="filter-card"><h5>Thông tin nhận hàng</h5><div className="row g-3 mt-1">{[['receiverName', 'Người nhận'], ['receiverPhone', 'Điện thoại'], ['receiverEmail', 'Email']].map(([k, l]) => <div className="col-md-6" key={k}><label className="form-label">{l}</label><input className="form-control" value={form[k]} onChange={e => setForm({
                  ...form,
                  [k]: e.target.value
                })} required /></div>)}<div className="col-12"><label className="form-label">Địa chỉ</label><textarea className="form-control" value={form.shippingAddress} onChange={e => setForm({
                  ...form,
                  shippingAddress: e.target.value
                })} required /></div><div className="col-12"><label className="form-label">Ghi chú</label><textarea className="form-control" value={form.note} onChange={e => setForm({
                  ...form,
                  note: e.target.value
                })} /></div></div><hr /><h5>Vận chuyển & thanh toán</h5><div className="row g-3"><div className="col-md-6"><select className="form-select" value={form.shippingMethod} onChange={e => setForm({
                  ...form,
                  shippingMethod: e.target.value
                })}><option value="STANDARD">Tiêu chuẩn - 30.000đ</option><option value="EXPRESS">Nhanh - 50.000đ</option></select></div><div className="col-md-6"><select className="form-select" value={form.paymentMethod} onChange={e => setForm({
                  ...form,
                  paymentMethod: e.target.value
                })}><option value="COD">COD</option><option value="BANK_TRANSFER">Bank Transfer (mô phỏng)</option><option value="VNPAY">VNPay (mô phỏng)</option><option value="MOMO">Momo (mô phỏng)</option></select></div></div></div></div><div className="col-lg-5"><div className="filter-card"><h5>Đơn hàng</h5>{cart.items?.map(x => <div className="d-flex justify-content-between py-2 border-bottom" key={x.CartItemID}><span>{x.ProductName} × {x.Quantity}</span><span>{money(x.UnitPrice * x.Quantity)}</span></div>)}<div className="input-group mt-3"><input className="form-control" placeholder="Mã voucher" value={form.couponCode} onChange={e => setForm({
                ...form,
                couponCode: e.target.value.toUpperCase()
              })} /><button className="btn btn-outline-primary" type="button" onClick={apply}>Áp dụng</button></div><div className="mt-3 d-flex justify-content-between"><span>Tạm tính</span><span>{money(cart.subtotal)}</span></div><div className="d-flex justify-content-between"><span>Giảm giá</span><span>-{money(discount)}</span></div><div className="d-flex justify-content-between"><span>Vận chuyển</span><span>{money(ship)}</span></div><hr /><div className="d-flex justify-content-between fs-5"><strong>Tổng</strong><strong className="text-danger">{money(total)}</strong></div><button className="btn btn-primary w-100 mt-4 py-2" disabled={busy}>{busy ? 'Đang tạo đơn...' : 'Đặt hàng'}</button></div></div></div></form></div>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import {useNavigate} from 'react-router-dom';import api from '../services/api';import {useCart} from '../context/CartContext';import {useAuth} from '../context/AuthContext';import {money} from '../utils/format';
// export default function CheckoutPage(){const {cart,load}=useCart();const {user}=useAuth();const nav=useNavigate();const [form,setForm]=useState({receiverName:user?.FullName||'',receiverPhone:user?.Phone||'',receiverEmail:user?.Email||'',shippingAddress:'',note:'',shippingMethod:'STANDARD',paymentMethod:'COD',couponCode:''}),[discount,setDiscount]=useState(0),[busy,setBusy]=useState(false);useEffect(()=>{api.get('/profile/addresses').then(r=>{const d=r.data.data.find(x=>x.IsDefault)||r.data.data[0];if(d)setForm(f=>({...f,shippingAddress:[d.AddressLine,d.Ward,d.District,d.Province].filter(Boolean).join(', '),receiverName:d.ReceiverName,receiverPhone:d.ReceiverPhone}))}).catch(()=>{})},[]);const ship=form.shippingMethod==='EXPRESS'?50000:30000;const total=Math.max(0,cart.subtotal-discount+ship);const apply=async()=>{try{const r=await api.post('/coupons/validate',{code:form.couponCode,subtotal:cart.subtotal});setDiscount(Number(r.data.data.discountAmount));alert(`Áp dụng voucher: -${money(r.data.data.discountAmount)}`)}catch(e){setDiscount(0);alert(e.response?.data?.message||'Voucher không hợp lệ')}};const submit=async e=>{e.preventDefault();if(!cart.items?.length)return alert('Giỏ hàng trống');setBusy(true);try{const r=await api.post('/orders/checkout',form);await load();nav('/orders/'+r.data.data.orderID)}catch(e){alert(e.response?.data?.message||'Không thể đặt hàng')}finally{setBusy(false)}};return <div className="container py-5"><h1 className="section-title mb-4">Thanh toán</h1><form onSubmit={submit}><div className="row g-4"><div className="col-lg-7"><div className="filter-card"><h5>Thông tin nhận hàng</h5><div className="row g-3 mt-1">{[['receiverName','Người nhận'],['receiverPhone','Điện thoại'],['receiverEmail','Email']].map(([k,l])=><div className="col-md-6" key={k}><label className="form-label">{l}</label><input className="form-control" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required/></div>)}<div className="col-12"><label className="form-label">Địa chỉ</label><textarea className="form-control" value={form.shippingAddress} onChange={e=>setForm({...form,shippingAddress:e.target.value})} required/></div><div className="col-12"><label className="form-label">Ghi chú</label><textarea className="form-control" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div></div><hr/><h5>Vận chuyển & thanh toán</h5><div className="row g-3"><div className="col-md-6"><select className="form-select" value={form.shippingMethod} onChange={e=>setForm({...form,shippingMethod:e.target.value})}><option value="STANDARD">Tiêu chuẩn - 30.000đ</option><option value="EXPRESS">Nhanh - 50.000đ</option></select></div><div className="col-md-6"><select className="form-select" value={form.paymentMethod} onChange={e=>setForm({...form,paymentMethod:e.target.value})}><option value="COD">COD</option><option value="BANK_TRANSFER">Bank Transfer (mô phỏng)</option><option value="VNPAY">VNPay (mô phỏng)</option><option value="MOMO">Momo (mô phỏng)</option></select></div></div></div></div><div className="col-lg-5"><div className="filter-card"><h5>Đơn hàng</h5>{cart.items?.map(x=><div className="d-flex justify-content-between py-2 border-bottom" key={x.CartItemID}><span>{x.ProductName} × {x.Quantity}</span><span>{money(x.UnitPrice*x.Quantity)}</span></div>)}<div className="input-group mt-3"><input className="form-control" placeholder="Mã voucher" value={form.couponCode} onChange={e=>setForm({...form,couponCode:e.target.value.toUpperCase()})}/><button className="btn btn-outline-primary" type="button" onClick={apply}>Áp dụng</button></div><div className="mt-3 d-flex justify-content-between"><span>Tạm tính</span><span>{money(cart.subtotal)}</span></div><div className="d-flex justify-content-between"><span>Giảm giá</span><span>-{money(discount)}</span></div><div className="d-flex justify-content-between"><span>Vận chuyển</span><span>{money(ship)}</span></div><hr/><div className="d-flex justify-content-between fs-5"><strong>Tổng</strong><strong className="text-danger">{money(total)}</strong></div><button className="btn btn-primary w-100 mt-4 py-2" disabled={busy}>{busy?'Đang tạo đơn...':'Đặt hàng'}</button></div></div></div></form></div>}
// 
// ===== HET MA CU =====
