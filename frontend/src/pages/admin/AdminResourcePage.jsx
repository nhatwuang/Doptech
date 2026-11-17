import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
const config = {
  categories: {
    title: 'Danh mục',
    fields: ['CategoryName', 'Slug', 'Status'],
    create: 'categoryName',
    id: 'CategoryID'
  },
  brands: {
    title: 'Thương hiệu',
    fields: ['BrandName', 'Slug', 'Status'],
    create: 'brandName',
    id: 'BrandID'
  },
  customers: {
    title: 'Khách hàng',
    fields: ['FullName', 'Email', 'Phone', 'Status', 'OrderCount'],
    id: 'UserID'
  },
  staff: {
    title: 'Nhân viên và quản trị viên',
    fields: ['FullName', 'Email', 'RoleName', 'StaffCode', 'Status'],
    id: 'UserID'
  },
  reviews: {
    title: 'Đánh giá',
    fields: ['FullName', 'ProductName', 'Rating', 'Comment', 'Status'],
    id: 'ReviewID'
  }
};
const labels = {
  CategoryName: 'Danh mục',
  BrandName: 'Thương hiệu',
  Slug: 'Đường dẫn',
  Status: 'Trạng thái',
  FullName: 'Họ tên',
  Email: 'Email',
  Phone: 'Điện thoại',
  OrderCount: 'Số đơn',
  RoleName: 'Vai trò',
  StaffCode: 'Mã nhân viên',
  ProductName: 'Sản phẩm',
  Rating: 'Số sao',
  Comment: 'Nhận xét'
};
export default function AdminResourcePage({
  type
}) {
  const c = config[type],
    {
      user
    } = useAuth();
  const [items, setItems] = useState([]),
    [name, setName] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [staff, setStaff] = useState({
      fullName: '',
      email: '',
      password: ''
    });
  const load = async () => setItems((await api.get('/admin/' + type)).data.data);
  useEffect(() => {
    setItems([]);
    setError('');
    load().catch(() => setError('Không tải được dữ liệu'));
  }, [type]);
  const act = async fn => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không thực hiện được thao tác');
    } finally {
      setBusy(false);
    }
  };
  return <><h2>{c.title}</h2>{error && <div role="alert" className="alert alert-danger">{error}</div>}
 {c.create && <form className="input-group mb-3" onSubmit={e => {
      e.preventDefault();
      act(async () => {
        await api.post('/admin/' + type, {
          [c.create]: name
        });
        setName('');
      });
    }}><input className="form-control" aria-label="Tên mới" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /><button className="btn btn-primary" disabled={busy}>Thêm</button></form>}
 {type === 'staff' && <form className="table-card mb-3" onSubmit={e => {
      e.preventDefault();
      act(async () => {
        await api.post('/admin/staff', staff);
        setStaff({
          fullName: '',
          email: '',
          password: ''
        });
      });
    }}><h5>Tạo nhân viên</h5><div className="row g-2">{[['fullName', 'Họ tên', 'text'], ['email', 'Email', 'email'], ['password', 'Mật khẩu ban đầu', 'password']].map(([k, l, t]) => <label className="col-md-4" key={k}>{l}<input className="form-control" type={t} required minLength={k === 'password' ? 8 : undefined} autoComplete={k === 'password' ? 'new-password' : 'off'} value={staff[k]} onChange={e => setStaff({
            ...staff,
            [k]: e.target.value
          })} /></label>)}<div><button className="btn btn-primary" disabled={busy}>Tạo tài khoản</button></div></div></form>}
 <div className="table-card table-responsive"><table className="table"><thead><tr>{c.fields.map(f => <th key={f}>{labels[f] || f}</th>)}<th>Thao tác</th></tr></thead><tbody>{items.map(x => <tr key={x[c.id]}>{c.fields.map(f => <td key={f}>{String(x[f] ?? '')}</td>)}<td><div className="d-flex gap-2">
 {['customers', 'staff'].includes(type) ? <><select aria-label="Trạng thái tài khoản" className="form-select" disabled={busy || x.UserID === user?.UserID} value={x.Status} onChange={e => act(() => api.put(`/admin/users/${x.UserID}/status`, {
                    status: e.target.value
                  }))}>{['ACTIVE', 'LOCKED', 'INACTIVE'].map(s => <option key={s}>{s}</option>)}</select><select aria-label="Vai trò tài khoản" className="form-select" disabled={busy || x.UserID === user?.UserID} value={x.RoleName || 'CUSTOMER'} onChange={e => {
                    const role = e.target.value;
                    if (confirm('Đổi vai trò và thu hồi các phiên đăng nhập của tài khoản này?')) act(() => api.put(`/admin/users/${x.UserID}/role`, {
                      role
                    }));
                  }}>{['CUSTOMER', 'STAFF', 'ADMIN'].map(s => <option key={s}>{s}</option>)}</select></> : <select aria-label="Trạng thái" className="form-select" disabled={busy} value={x.Status} onChange={e => act(() => api.put(`/admin/${type}/${x[c.id]}/status`, {
                  status: e.target.value
                }))}>{(type === 'reviews' ? ['PENDING', 'APPROVED', 'HIDDEN'] : ['ACTIVE', 'INACTIVE']).map(s => <option key={s}>{s}</option>)}</select>}
 </div></td></tr>)}</tbody></table>{!items.length && <p>Chưa có dữ liệu.</p>}</div></>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import api from '../../services/api';import {money,dateTime} from '../../utils/format';
// const config={categories:{title:'Danh mục',endpoint:'/admin/categories',fields:['CategoryID','CategoryName','Slug','Status'],create:'categoryName'},brands:{title:'Thương hiệu',endpoint:'/admin/brands',fields:['BrandID','BrandName','Slug','Status'],create:'brandName'},customers:{title:'Khách hàng',endpoint:'/admin/customers',fields:['UserID','FullName','Email','Phone','Status','OrderCount']},staff:{title:'Nhân viên',endpoint:'/admin/staff',fields:['UserID','FullName','Email','StaffCode','Position','Status']},coupons:{title:'Voucher',endpoint:'/admin/coupons',fields:['CouponID','Code','DiscountType','DiscountValue','UsedCount','Status']},reviews:{title:'Đánh giá',endpoint:'/admin/reviews',fields:['ReviewID','FullName','ProductName','Rating','Comment','Status']}};
// export default function AdminResourcePage({type}){const c=config[type];const [items,setItems]=useState([]),[name,setName]=useState('');const load=()=>api.get(c.endpoint).then(r=>setItems(r.data.data));useEffect(()=>{load()},[type]);const create=async()=>{if(!c.create||!name.trim())return;try{await api.post(c.endpoint,{[c.create]:name});setName('');load()}catch(e){alert(e.response?.data?.message)}};return <><div className="d-flex justify-content-between align-items-center mb-4"><div><h2 className="fw-bold mb-1">{c.title}</h2><div className="text-secondary">Quản trị dữ liệu {c.title.toLowerCase()}</div></div>{c.create&&<div className="input-group" style={{maxWidth:380}}><input className="form-control" placeholder={`Tên ${c.title.toLowerCase()}`} value={name} onChange={e=>setName(e.target.value)}/><button className="btn btn-primary" onClick={create}>Thêm</button></div>}</div><div className="table-card"><table className="table"><thead><tr>{c.fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{items.map((x,i)=><tr key={x.UserID||x.CategoryID||x.BrandID||x.CouponID||x.ReviewID||i}>{c.fields.map(f=><td key={f}>{f.toLowerCase().includes('amount')||f==='DiscountValue'?money(x[f]):f.toLowerCase().includes('date')?dateTime(x[f]):String(x[f]??'')}</td>)}</tr>)}</tbody></table></div></>}
// 
// ===== HET MA CU =====
