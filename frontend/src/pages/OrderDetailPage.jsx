import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { money, dateTime } from '../utils/format';
import Loading from '../components/Loading';
const states = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'];
export default function OrderDetailPage() {
  const {
    id
  } = useParams();
  const {
    isCustomer,
    isAdmin
  } = useAuth();
  const [o, setO] = useState(null);
  const [review, setReview] = useState(null),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = () => api.get('/orders/' + id).then(r => setO(r.data.data));
  useEffect(() => {
    load().catch(e => setError(e.response?.data?.message || 'Không tải được đơn hàng'));
  }, [id]);
  if (!o) return error ? <div className="container py-5 alert alert-danger">{error}</div> : <Loading />;
  const pos = states.indexOf(o.Status);
  return <div className="container py-5"><div className="d-flex justify-content-between align-items-center mb-4"><div><h1 className="section-title mb-1">{o.OrderCode}</h1><span className="text-secondary">{dateTime(o.CreatedAt)}</span></div>{['PENDING', 'CONFIRMED'].includes(o.Status) && <button className="btn btn-outline-danger" onClick={async () => {
        if (confirm('Hủy đơn hàng này?')) {
          try {
            await (isCustomer ? api.post(`/orders/${o.OrderID}/cancel`) : api.put(`/admin/orders/${o.OrderID}/status`, {
              status: 'CANCELLED'
            }));
            load();
          } catch (e) {
            alert(e.response?.data?.message);
          }
        }
      }}>Hủy đơn</button>}</div><div className="order-timeline mb-4">{states.map((s, i) => <div key={s} className={`order-step ${pos >= i ? 'active' : ''}`}>{s}</div>)}{o.Status === 'CANCELLED' && <div className="order-step bg-danger text-white">CANCELLED</div>}</div>{error && <div className="alert alert-danger" role="alert">{error}</div>}{review && <form className="filter-card mb-3" onSubmit={async e => {
      e.preventDefault();
      setBusy(true);
      try {
        await api.post('/reviews', {
          productID: review.ProductID,
          orderID: o.OrderID,
          rating: Number(rating),
          comment
        });
        setReview(null);
        await load();
      } catch (e) {
        setError(e.response?.data?.message || 'Không gửi được đánh giá');
      } finally {
        setBusy(false);
      }
    }}><h5>Đánh giá {review.ProductName}</h5><label>Số sao<select className="form-select" value={rating} onChange={e => setRating(e.target.value)}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} sao</option>)}</select></label><label className="d-block">Nhận xét<textarea className="form-control my-2" maxLength={1500} value={comment} onChange={e => setComment(e.target.value)} /></label><button className="btn btn-primary me-2" disabled={busy}>Gửi đánh giá</button><button type="button" className="btn btn-secondary" onClick={() => setReview(null)}>Đóng</button></form>}<div className="filter-card mb-3"><h5>Lịch sử xử lý</h5>{o.history?.length ? o.history.map(h => <p key={h.HistoryID}>{dateTime(h.CreatedAt)} · {h.FromStatus || 'Tạo đơn'} → {h.ToStatus} · {h.ChangedByName || 'Hệ thống'}</p>) : <p>Đơn cũ chưa có lịch sử xử lý chi tiết.</p>}</div><div className="row g-4"><div className="col-lg-8"><div className="table-card"><h5>Sản phẩm</h5><table className="table"><thead><tr><th>Tên</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th><th></th></tr></thead><tbody>{o.items.map(x => <tr key={x.OrderDetailID}><td>{x.ProductName}<div className="small text-secondary">{x.SKU}</div></td><td>{money(x.UnitPrice)}</td><td>{x.Quantity}</td><td>{money(x.LineTotal)}</td><td>{isCustomer && o.Status === 'COMPLETED' && <button className="btn btn-sm btn-outline-warning" onClick={() => {
                    setReview(x);
                    setRating(5);
                    setComment('');
                    setError('');
                  }}>Đánh giá</button>}</td></tr>)}</tbody></table></div></div><div className="col-lg-4"><div className="filter-card"><h5>Thông tin đơn hàng</h5><p><strong>Người nhận:</strong><br />{o.ReceiverName} · {o.ReceiverPhone}</p><p><strong>Địa chỉ:</strong><br />{o.ShippingAddress}</p><p><strong>Thanh toán:</strong><br />{o.PaymentMethod} · {o.PaymentStatus}</p>{(isCustomer || isAdmin) && !['CANCELLED', 'COMPLETED'].includes(o.Status) && o.PaymentMethod !== 'COD' && o.PaymentStatus === 'PENDING' && <button className="btn btn-outline-primary w-100 mb-3" onClick={async () => {
            try {
              await api.post(`/payments/order/${o.OrderID}/simulate-success`);
              load();
            } catch (e) {
              alert(e.response?.data?.message);
            }
          }}>Mô phỏng thanh toán thành công</button>}<hr /><div className="d-flex justify-content-between"><span>Tạm tính</span><span>{money(o.Subtotal)}</span></div><div className="d-flex justify-content-between"><span>Giảm</span><span>-{money(o.DiscountAmount)}</span></div><div className="d-flex justify-content-between"><span>Phí ship</span><span>{money(o.ShippingFee)}</span></div><div className="d-flex justify-content-between fs-5 mt-2"><strong>Tổng</strong><strong className="text-danger">{money(o.TotalAmount)}</strong></div></div>{o.Status === 'COMPLETED' && <div className="alert alert-success mt-3">Bạn có thể đánh giá sản phẩm đã mua từ trang chi tiết sản phẩm hoặc API review.</div>}</div></div></div>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import {useParams} from 'react-router-dom';import api from '../services/api';import {money,dateTime} from '../utils/format';import Loading from '../components/Loading';
// const states=['PENDING','CONFIRMED','PACKING','SHIPPING','COMPLETED'];
// export default function OrderDetailPage(){const {id}=useParams();const [o,setO]=useState(null);const load=()=>api.get('/orders/'+id).then(r=>setO(r.data.data));useEffect(()=>{load()},[id]);if(!o)return <Loading/>;const pos=states.indexOf(o.Status);return <div className="container py-5"><div className="d-flex justify-content-between align-items-center mb-4"><div><h1 className="section-title mb-1">{o.OrderCode}</h1><span className="text-secondary">{dateTime(o.CreatedAt)}</span></div>{['PENDING','CONFIRMED'].includes(o.Status)&&<button className="btn btn-outline-danger" onClick={async()=>{if(confirm('Hủy đơn hàng này?')){try{await api.post(`/orders/${o.OrderID}/cancel`);load()}catch(e){alert(e.response?.data?.message)}}}}>Hủy đơn</button>}</div><div className="order-timeline mb-4">{states.map((s,i)=><div key={s} className={`order-step ${pos>=i?'active':''}`}>{s}</div>)}{o.Status==='CANCELLED'&&<div className="order-step bg-danger text-white">CANCELLED</div>}</div><div className="row g-4"><div className="col-lg-8"><div className="table-card"><h5>Sản phẩm</h5><table className="table"><thead><tr><th>Tên</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th><th></th></tr></thead><tbody>{o.items.map(x=><tr key={x.OrderDetailID}><td>{x.ProductName}<div className="small text-secondary">{x.SKU}</div></td><td>{money(x.UnitPrice)}</td><td>{x.Quantity}</td><td>{money(x.LineTotal)}</td><td>{o.Status==='COMPLETED'&&<button className="btn btn-sm btn-outline-warning" onClick={async()=>{const c=prompt("Nhận xét sản phẩm", "Sản phẩm tốt, đúng mô tả.");if(c!==null){try{await api.post("/reviews",{productID:x.ProductID,orderID:o.OrderID,rating:5,comment:c});alert("Đánh giá thành công") }catch(e){alert(e.response?.data?.message||"Không thể đánh giá")}}}}>Đánh giá</button>}</td></tr>)}</tbody></table></div></div><div className="col-lg-4"><div className="filter-card"><h5>Thông tin đơn hàng</h5><p><strong>Người nhận:</strong><br/>{o.ReceiverName} · {o.ReceiverPhone}</p><p><strong>Địa chỉ:</strong><br/>{o.ShippingAddress}</p><p><strong>Thanh toán:</strong><br/>{o.PaymentMethod} · {o.PaymentStatus}</p>{o.PaymentMethod!=='COD'&&o.PaymentStatus==='PENDING'&&<button className="btn btn-outline-primary w-100 mb-3" onClick={async()=>{try{await api.post(`/payments/order/${o.OrderID}/simulate-success`);load()}catch(e){alert(e.response?.data?.message)}}}>Mô phỏng thanh toán thành công</button>}<hr/><div className="d-flex justify-content-between"><span>Tạm tính</span><span>{money(o.Subtotal)}</span></div><div className="d-flex justify-content-between"><span>Giảm</span><span>-{money(o.DiscountAmount)}</span></div><div className="d-flex justify-content-between"><span>Phí ship</span><span>{money(o.ShippingFee)}</span></div><div className="d-flex justify-content-between fs-5 mt-2"><strong>Tổng</strong><strong className="text-danger">{money(o.TotalAmount)}</strong></div></div>{o.Status==='COMPLETED'&&<div className="alert alert-success mt-3">Bạn có thể đánh giá sản phẩm đã mua từ trang chi tiết sản phẩm hoặc API review.</div>}</div></div></div>}
// 
// ===== HET MA CU =====
