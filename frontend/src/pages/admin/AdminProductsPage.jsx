import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { money } from '../../utils/format';
const blank = () => ({
  productName: '',
  sku: '',
  categoryID: '',
  brandID: '',
  price: '',
  discountPrice: '',
  stock: 0,
  thumbnail: '',
  featured: false,
  status: 'ACTIVE',
  description: '',
  shortDescription: '',
  specifications: [],
  images: []
});
export default function AdminProductsPage() {
  const {
      id
    } = useParams(),
    location = useLocation();
  const [items, setItems] = useState([]),
    [cats, setCats] = useState([]),
    [brands, setBrands] = useState([]),
    [form, setForm] = useState(blank),
    [editing, setEditing] = useState(null),
    [show, setShow] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const field = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const load = async () => setItems((await api.get('/admin/products')).data.data);
  const edit = async pid => {
    try {
      setError('');
      const x = (await api.get('/admin/products/' + pid)).data.data;
      setForm({
        productName: x.ProductName,
        sku: x.SKU,
        categoryID: x.CategoryID,
        brandID: x.BrandID,
        price: x.Price,
        discountPrice: x.DiscountPrice ?? '',
        stock: 0,
        thumbnail: x.Thumbnail || '',
        featured: x.Featured,
        status: x.Status,
        description: x.Description || '',
        shortDescription: x.ShortDescription || '',
        specifications: x.specifications,
        images: x.images
      });
      setEditing(pid);
      setShow(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Không tải được sản phẩm');
    }
  };
  useEffect(() => {
    Promise.all([load(), api.get('/admin/categories').then(r => setCats(r.data.data)), api.get('/admin/brands').then(r => setBrands(r.data.data))]).catch(() => setError('Không tải được danh sách'));
  }, []);
  useEffect(() => {
    if (id) edit(id);else if (location.pathname.endsWith('/new')) {
      setForm(blank());
      setEditing(null);
      setShow(true);
    }
  }, [id, location.pathname]);
  const save = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api[editing ? 'put' : 'post']('/admin/products' + (editing ? '/' + editing : ''), {
        ...form,
        images: form.images.map(x => x.trim()).filter(Boolean)
      });
      setShow(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không lưu được sản phẩm');
    } finally {
      setBusy(false);
    }
  };
  const toggle = async x => {
    try {
      if (!confirm('Vô hiệu hóa sản phẩm này?')) return;
      await api.delete('/admin/products/' + x.ProductID);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Không cập nhật được');
    }
  };
  return <><div className="d-flex justify-content-between mb-3"><h2>Quản lý sản phẩm</h2><button className="btn btn-primary" onClick={() => {
        setEditing(null);
        setForm(blank());
        setShow(true);
      }}>Thêm sản phẩm</button></div>{error && <div role="alert" className="alert alert-danger">{error}</div>}
 {show && <form className="table-card mb-4" onSubmit={save}><h4>{editing ? 'Chỉnh sửa sản phẩm' : 'Sản phẩm mới'}</h4><div className="row g-3">
 {[["productName", "Tên sản phẩm"], ["sku", "SKU"], ["price", "Giá bán"], ["discountPrice", "Giá khuyến mãi"], ["thumbnail", "URL ảnh đại diện"]].map(([k, l]) => <label key={k} className="col-md-6">{l}<input className="form-control" type={k.includes('rice') ? 'number' : 'text'} min="0" step="0.01" required={['productName', 'sku', 'price'].includes(k)} value={form[k]} onChange={e => field(k, e.target.value)} /></label>)}
 {!editing && <label className="col-md-6">Tồn kho ban đầu<input className="form-control" type="number" min="0" step="1" value={form.stock} onChange={e => field('stock', e.target.value)} /></label>}
 <label className="col-md-6">Danh mục<select className="form-select" required value={form.categoryID} onChange={e => field('categoryID', e.target.value)}><option value="">Chọn danh mục</option>{cats.map(x => <option key={x.CategoryID} value={x.CategoryID}>{x.CategoryName} · {x.Status}</option>)}</select></label>
 <label className="col-md-6">Thương hiệu<select className="form-select" required value={form.brandID} onChange={e => field('brandID', e.target.value)}><option value="">Chọn thương hiệu</option>{brands.map(x => <option key={x.BrandID} value={x.BrandID}>{x.BrandName} · {x.Status}</option>)}</select></label>
 <label className="col-md-6">Trạng thái<select className="form-select" value={form.status} onChange={e => field('status', e.target.value)}>{['ACTIVE', 'INACTIVE', 'DISCONTINUED'].map(x => <option key={x}>{x}</option>)}</select></label>
 <label className="col-md-6 align-self-end"><input type="checkbox" checked={!!form.featured} onChange={e => field('featured', e.target.checked)} /> Sản phẩm nổi bật</label>
 <label className="col-12">Mô tả ngắn<textarea className="form-control" maxLength={700} value={form.shortDescription} onChange={e => field('shortDescription', e.target.value)} /></label>
 <label className="col-12">Mô tả chi tiết<textarea className="form-control" rows={4} maxLength={20000} value={form.description} onChange={e => field('description', e.target.value)} /></label>
 <div className="col-12"><h5>Thông số kỹ thuật</h5><p className="text-secondary">Dùng tên thống nhất: RAM (GB), SSD (GB), Trọng lượng (kg), Pin (mAh).</p>{form.specifications.map((s, i) => <div className="d-flex gap-2 mb-2" key={i}><input aria-label="Tên thông số" className="form-control" required placeholder="RAM" value={s.name} onChange={e => field('specifications', form.specifications.map((v, j) => j === i ? {
              ...v,
              name: e.target.value
            } : v))} /><input aria-label="Giá trị thông số" className="form-control" required placeholder="16 GB" value={s.value} onChange={e => field('specifications', form.specifications.map((v, j) => j === i ? {
              ...v,
              value: e.target.value
            } : v))} /><button type="button" className="btn btn-outline-danger" onClick={() => field('specifications', form.specifications.filter((_, j) => j !== i))}>Xóa</button></div>)}<button type="button" className="btn btn-outline-primary" onClick={() => field('specifications', [...form.specifications, {
            name: '',
            value: ''
          }])}>Thêm thông số</button></div>
 <label className="col-12">Ảnh thư viện (mỗi dòng một URL)<textarea className="form-control" rows={3} value={form.images.join('\n')} onChange={e => field('images', e.target.value.split('\n'))} /></label>
 <div className="col-12 d-flex gap-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu sản phẩm'}</button><button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>Đóng</button></div></div></form>}
 <div className="table-card table-responsive"><table className="table"><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Kho</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{items.map(x => <tr key={x.ProductID}><td>{x.ProductName}<small className="d-block">{x.SKU}</small></td><td>{x.CategoryName}</td><td>{money(x.DiscountPrice ?? x.Price)}</td><td>{x.StockQuantity}</td><td>{x.Status}</td><td><button className="btn btn-sm btn-outline-primary me-2" onClick={() => edit(x.ProductID)}>Chỉnh sửa</button><button className="btn btn-sm btn-outline-danger" disabled={x.Status === 'INACTIVE'} onClick={() => toggle(x)}>Vô hiệu hóa</button></td></tr>)}</tbody></table></div></>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import api from '../../services/api';import {money} from '../../utils/format';
// export default function AdminProductsPage(){const [items,setItems]=useState([]),[cats,setCats]=useState([]),[brands,setBrands]=useState([]),[show,setShow]=useState(false),[form,setForm]=useState({productName:'',categoryID:'',brandID:'',price:'',discountPrice:'',sku:'',stock:10,thumbnail:'',featured:false});const load=()=>api.get('/admin/products').then(r=>setItems(r.data.data));useEffect(()=>{load();api.get('/categories').then(r=>setCats(r.data.data));api.get('/brands').then(r=>setBrands(r.data.data))},[]);const create=async e=>{e.preventDefault();try{await api.post('/admin/products',form);setShow(false);setForm({productName:'',categoryID:'',brandID:'',price:'',discountPrice:'',sku:'',stock:10,thumbnail:'',featured:false});load()}catch(e){alert(e.response?.data?.message||'Không thể tạo sản phẩm')}};return <><div className="d-flex justify-content-between align-items-center mb-4"><div><h2 className="fw-bold mb-1">Quản lý sản phẩm</h2><div className="text-secondary">{items.length} sản phẩm</div></div><button className="btn btn-primary" onClick={()=>setShow(v=>!v)}><i className="bi bi-plus-lg"/> Thêm sản phẩm</button></div>{show&&<form className="table-card mb-4" onSubmit={create}><h5>Sản phẩm mới</h5><div className="row g-3">{[['productName','Tên sản phẩm'],['sku','SKU'],['price','Giá'],['discountPrice','Giá khuyến mãi'],['stock','Tồn kho'],['thumbnail','Ảnh URL']].map(([k,l])=><div className="col-md-4" key={k}><label className="form-label">{l}</label><input className="form-control" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required={['productName','sku','price'].includes(k)}/></div>)}<div className="col-md-4"><label className="form-label">Danh mục</label><select className="form-select" required value={form.categoryID} onChange={e=>setForm({...form,categoryID:e.target.value})}><option value="">Chọn</option>{cats.map(x=><option key={x.CategoryID} value={x.CategoryID}>{x.CategoryName}</option>)}</select></div><div className="col-md-4"><label className="form-label">Thương hiệu</label><select className="form-select" required value={form.brandID} onChange={e=>setForm({...form,brandID:e.target.value})}><option value="">Chọn</option>{brands.map(x=><option key={x.BrandID} value={x.BrandID}>{x.BrandName}</option>)}</select></div><div className="col-md-4 d-flex align-items-end"><div className="form-check mb-2"><input className="form-check-input" type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/><label className="form-check-label">Nổi bật</label></div></div><div className="col-12"><button className="btn btn-primary">Lưu sản phẩm</button></div></div></form>}<div className="table-card"><table className="table align-middle"><thead><tr><th>ID</th><th>Sản phẩm</th><th>Danh mục</th><th>Brand</th><th>Giá</th><th>Kho</th><th>Trạng thái</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.ProductID}><td>{x.ProductID}</td><td><strong>{x.ProductName}</strong><div className="small text-secondary">{x.SKU}</div></td><td>{x.CategoryName}</td><td>{x.BrandName}</td><td>{money(x.DiscountPrice??x.Price)}</td><td>{x.StockQuantity}</td><td>{x.Status}</td><td><div className="d-flex gap-1"><button className="btn btn-sm btn-outline-primary" onClick={async()=>{const v=prompt("Giá mới",String(x.Price));if(v!==null&&Number(v)>0){await api.put(`/admin/products/${x.ProductID}`,{price:Number(v)});load()}}}>Sửa giá</button><button className="btn btn-sm btn-outline-danger" disabled={x.Status==='INACTIVE'} onClick={async()=>{if(confirm('Vô hiệu hóa sản phẩm?')){await api.delete('/admin/products/'+x.ProductID);load()}}}>Disable</button></div></td></tr>)}</tbody></table></div></>}
// 
// ===== HET MA CU =====
