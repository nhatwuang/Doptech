import { useEffect, useState } from 'react';
import api from '../../services/api';
import { money, dateTime } from '../../utils/format';
const statuses = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'COMPLETED'];
export default function AdminOrdersPage() {
  const [items, setItems] = useState([]),
    [filter, setFilter] = useState('');
  const load = () => api.get('/admin/orders' + (filter ? `?status=${filter}` : '')).then(r => setItems(r.data.data));
  useEffect(() => {
    load();
  }, [filter]);
  return <><div className="d-flex justify-content-between align-items-center mb-4"><div><h2 className="fw-bold mb-1">Quản lý đơn hàng</h2><div className="text-secondary">Cập nhật quy trình xử lý và giao hàng</div></div><select className="form-select" style={{
        width: 190
      }} value={filter} onChange={e => setFilter(e.target.value)}><option value="">Tất cả trạng thái</option>{[...statuses, 'CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></div><div className="table-card"><table className="table align-middle"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>{items.map(o => <tr key={o.OrderID}><td className="fw-bold"><a href={'/orders/' + o.OrderID}>{o.OrderCode}</a></td><td>{o.FullName}<div className="small text-secondary">{o.Email}</div></td><td>{money(o.TotalAmount)}</td><td>{o.PaymentMethod} · {o.PaymentStatus}</td><td><select className="form-select form-select-sm" value={o.Status} disabled={['COMPLETED', 'CANCELLED'].includes(o.Status)} onChange={async e => {
                try {
                  await api.put(`/admin/orders/${o.OrderID}/status`, {
                    status: e.target.value
                  });
                  load();
                } catch (err) {
                  alert(err.response?.data?.message);
                }
              }}>{[o.Status, ...({
                  PENDING: ['CONFIRMED', 'CANCELLED'],
                  CONFIRMED: ['PACKING', 'CANCELLED'],
                  PACKING: ['SHIPPING'],
                  SHIPPING: ['COMPLETED']
                }[o.Status] || [])].map(s => <option key={s}>{s}</option>)}{o.Status === 'CANCELLED' && <option>CANCELLED</option>}</select></td><td>{dateTime(o.CreatedAt)}</td></tr>)}</tbody></table></div></>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import api from '../../services/api';import {money,dateTime} from '../../utils/format';
// const statuses=['PENDING','CONFIRMED','PACKING','SHIPPING','COMPLETED'];
// export default function AdminOrdersPage(){const [items,setItems]=useState([]),[filter,setFilter]=useState('');const load=()=>api.get('/admin/orders'+(filter?`?status=${filter}`:'')).then(r=>setItems(r.data.data));useEffect(()=>{load()},[filter]);return <><div className="d-flex justify-content-between align-items-center mb-4"><div><h2 className="fw-bold mb-1">Quản lý đơn hàng</h2><div className="text-secondary">Cập nhật quy trình xử lý và giao hàng</div></div><select className="form-select" style={{width:190}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Tất cả trạng thái</option>{[...statuses,'CANCELLED'].map(s=><option key={s}>{s}</option>)}</select></div><div className="table-card"><table className="table align-middle"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>{items.map(o=><tr key={o.OrderID}><td className="fw-bold">{o.OrderCode}</td><td>{o.FullName}<div className="small text-secondary">{o.Email}</div></td><td>{money(o.TotalAmount)}</td><td>{o.PaymentMethod} · {o.PaymentStatus}</td><td><select className="form-select form-select-sm" value={o.Status} disabled={['COMPLETED','CANCELLED'].includes(o.Status)} onChange={async e=>{try{await api.put(`/admin/orders/${o.OrderID}/status`,{status:e.target.value});load()}catch(err){alert(err.response?.data?.message)}}}>{statuses.map(s=><option key={s}>{s}</option>)}{o.Status==='CANCELLED'&&<option>CANCELLED</option>}</select></td><td>{dateTime(o.CreatedAt)}</td></tr>)}</tbody></table></div></>}
// 
// ===== HET MA CU =====
