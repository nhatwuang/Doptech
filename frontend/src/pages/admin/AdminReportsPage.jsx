import { useEffect, useState } from 'react';
import api from '../../services/api';
import { money } from '../../utils/format';
import Loading from '../../components/Loading';
export default function AdminReportsPage() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get('/admin/reports').then(r => setD(r.data.data));
  }, []);
  if (!d) return <Loading />;
  return <><h2 className="fw-bold mb-4">Báo cáo</h2><p className="text-secondary">{d.basis}</p><div className="row g-4"><div className="col-md-4"><div className="stat-card"><div className="text-secondary">Giá trị trung bình đơn hoàn thành</div><div className="value">{money(d.averageOrderValue)}</div></div></div></div><div className="row g-4 mt-1"><div className="col-lg-6"><div className="table-card"><h5>Doanh thu theo tháng</h5><table className="table"><tbody>{d.monthly.map(x => <tr key={x.Label}><td>{x.Label}</td><td className="text-end fw-bold">{money(x.Revenue)}</td></tr>)}</tbody></table></div></div><div className="col-lg-6"><div className="table-card"><h5>Doanh thu theo năm</h5><table className="table"><tbody>{d.yearly.map(x => <tr key={x.Label}><td>{x.Label}</td><td className="text-end fw-bold">{money(x.Revenue)}</td></tr>)}</tbody></table></div></div></div></>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useEffect,useState} from 'react';import api from '../../services/api';import {money} from '../../utils/format';import Loading from '../../components/Loading';
// export default function AdminReportsPage(){const [d,setD]=useState(null);useEffect(()=>{api.get('/admin/reports').then(r=>setD(r.data.data))},[]);if(!d)return <Loading/>;return <><h2 className="fw-bold mb-4">Báo cáo</h2><div className="row g-4"><div className="col-md-4"><div className="stat-card"><div className="text-secondary">Average Order Value</div><div className="value">{money(d.averageOrderValue)}</div></div></div></div><div className="row g-4 mt-1"><div className="col-lg-6"><div className="table-card"><h5>Doanh thu theo tháng</h5><table className="table"><tbody>{d.monthly.map(x=><tr key={x.Label}><td>{x.Label}</td><td className="text-end fw-bold">{money(x.Revenue)}</td></tr>)}</tbody></table></div></div><div className="col-lg-6"><div className="table-card"><h5>Doanh thu theo năm</h5><table className="table"><tbody>{d.yearly.map(x=><tr key={x.Label}><td>{x.Label}</td><td className="text-end fw-bold">{money(x.Revenue)}</td></tr>)}</tbody></table></div></div></div></>}
// 
// ===== HET MA CU =====
