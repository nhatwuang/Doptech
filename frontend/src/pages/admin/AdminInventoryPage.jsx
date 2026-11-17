import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { dateTime } from '../../utils/format';
export default function AdminInventoryPage() {
  const {
    isAdmin
  } = useAuth();
  const [items, setItems] = useState([]),
    [selected, setSelected] = useState(null),
    [type, setType] = useState('IMPORT'),
    [quantity, setQuantity] = useState(1),
    [note, setNote] = useState(''),
    [history, setHistory] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => setItems((await api.get('/inventory')).data.data);
  useEffect(() => {
    load().catch(() => setError('Không tải được kho'));
  }, []);
  const open = async x => {
    setSelected(x);
    setType('IMPORT');
    setQuantity(1);
    setNote('');
    setHistory([]);
    setError('');
    try {
      setHistory((await api.get(`/inventory/${x.ProductID}/history`)).data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Không tải được lịch sử');
    }
  };
  const save = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/inventory/${selected.ProductID}/adjust`, {
        type,
        quantity: Number(quantity),
        note
      });
      await load();
      await open(selected);
    } catch (e) {
      setError(e.response?.data?.message || 'Không cập nhật được kho');
    } finally {
      setBusy(false);
    }
  };
  return <><h2>Quản lý kho</h2>{error && <div role="alert" className="alert alert-danger">{error}</div>}{selected && <div className="table-card mb-3"><h5>{selected.ProductName}</h5><form className="row g-2" onSubmit={save}><label className="col-md-3">Thao tác<select className="form-select" value={type} onChange={e => setType(e.target.value)}><option value="IMPORT">Nhập kho</option>{isAdmin && <><option value="ADJUSTMENT">Điều chỉnh tăng/giảm</option><option value="RETURN">Nhập hàng trả</option></>}</select></label><label className="col-md-3">Số lượng (âm để giảm)<input className="form-control" type="number" step="1" min={type === 'ADJUSTMENT' ? undefined : 1} required value={quantity} onChange={e => setQuantity(e.target.value)} /></label><label className="col-md-6">Lý do<input className="form-control" required maxLength={500} value={note} onChange={e => setNote(e.target.value)} /></label><div><button className="btn btn-primary me-2" disabled={busy}>Lưu biến động kho</button><button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button></div></form><h6 className="mt-3">100 biến động gần nhất</h6><div className="table-responsive"><table className="table"><thead><tr><th>Thời điểm</th><th>Loại</th><th>Trước → sau</th><th>Người thực hiện</th><th>Lý do</th></tr></thead><tbody>{history.map(h => <tr key={h.TransactionID}><td>{dateTime(h.CreatedAt)}</td><td>{h.Type}</td><td>{h.BeforeQuantity} → {h.AfterQuantity}</td><td>{h.FullName}</td><td>{h.Note}</td></tr>)}</tbody></table></div></div>}
 <div className="table-card table-responsive"><table className="table"><thead><tr><th>SKU</th><th>Sản phẩm</th><th>Tồn</th><th>Đã giữ</th><th>Tình trạng</th><th /></tr></thead><tbody>{items.map(x => <tr key={x.InventoryID}><td>{x.SKU}</td><td>{x.ProductName}</td><td>{x.Quantity}</td><td>{x.ReservedQuantity}</td><td>{x.StockStatus}</td><td><button className="btn btn-sm btn-outline-primary" onClick={() => open(x)}>Lịch sử / cập nhật</button></td></tr>)}</tbody></table></div></>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import api from '../../services/api';
// export default function AdminInventoryPage(){const [items,setItems]=useState([]);const load=()=>api.get('/inventory').then(r=>setItems(r.data.data));useEffect(()=>{load()},[]);const adjust=async x=>{const raw=prompt(`Nhập số lượng cần nhập thêm cho ${x.ProductName}:`,'10');if(raw===null)return;const q=Number(raw);if(!Number.isInteger(q)||q<=0)return alert('Số lượng không hợp lệ');try{await api.post(`/inventory/${x.ProductID}/adjust`,{type:'IMPORT',quantity:q,note:'Nhập kho từ giao diện Admin'});load()}catch(e){alert(e.response?.data?.message)}};return <><div className="mb-4"><h2 className="fw-bold mb-1">Kho hàng</h2><div className="text-secondary">Nhập kho, theo dõi tồn và cảnh báo mức thấp</div></div><div className="table-card"><table className="table align-middle"><thead><tr><th>SKU</th><th>Sản phẩm</th><th>Tồn</th><th>Ngưỡng</th><th>Tình trạng</th><th/></tr></thead><tbody>{items.map(x=><tr key={x.InventoryID}><td>{x.SKU}</td><td>{x.ProductName}</td><td className="fw-bold">{x.Quantity}</td><td>{x.ReorderLevel}</td><td><span className={`badge ${x.StockStatus==='OK'?'bg-success':x.StockStatus==='LOW'?'bg-warning text-dark':'bg-danger'}`}>{x.StockStatus}</span></td><td><button className="btn btn-sm btn-outline-primary" onClick={()=>adjust(x)}>Nhập kho</button></td></tr>)}</tbody></table></div></>}
// 
// ===== HET MA CU =====
