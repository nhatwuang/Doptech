import { useState } from 'react';
import api from '../services/api';
export default function AIChat() {
  const [open, setOpen] = useState(false),
    [text, setText] = useState(''),
    [messages, setMessages] = useState([{
      who: 'ai',
      text: 'Xin chào! Mình là DopTech AI. Bạn cần tư vấn laptop, điện thoại hay linh kiện theo ngân sách?'
    }]),
    [loading, setLoading] = useState(false);
  const send = async () => {
    const q = text.trim();
    if (!q || loading) return;
    setText('');
    setMessages(m => [...m, {
      who: 'me',
      text: q
    }]);
    setLoading(true);
    try {
      const r = await api.post('/ai/chat', {
        message: q,
        history: messages.filter(m => m.who === 'me').slice(-6).map(m => m.text)
      });
      setMessages(m => [...m, {
        who: 'ai',
        text: r.data.data.answer,
        products: r.data.data.recommendedProducts,
        mode: r.data.data.mode
      }]);
    } catch (e) {
      setMessages(m => [...m, {
        who: 'ai',
        text: e.response?.data?.message || 'DopTech AI đang bận. Vui lòng thử lại.'
      }]);
    } finally {
      setLoading(false);
    }
  };
  return <><button className="ai-fab" onClick={() => setOpen(v => !v)}><i className="bi bi-stars" /> <span>DopTech AI</span></button>{open && <div className="ai-panel"><div className="ai-head"><strong><i className="bi bi-stars" /> DopTech AI</strong><button className="btn btn-sm btn-light" disabled={loading} onClick={() => setMessages([{
          who: "ai",
          text: "Bắt đầu tư vấn mới. Bạn cần sản phẩm gì?"
        }])}>Tư vấn mới</button><button className="btn-close btn-close-white" onClick={() => setOpen(false)} /></div><div className="ai-body">{messages.map((m, i) => <div key={i} className={`ai-msg ${m.who}`}><div style={{
            whiteSpace: "pre-wrap"
          }}>{m.text}</div>{m.products?.length > 0 && <div className="mt-2">{m.products.map(p => <a key={p.ProductID} href={`/products/${p.Slug}`} className="ai-product">{p.ProductName}</a>)}</div>}</div>)}{loading && <div className="ai-msg ai">Đang tìm sản phẩm thật trong DopTech...</div>}</div><div className="ai-input"><input maxLength={2000} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="VD: laptop dưới 20 triệu học IT" /><button onClick={send}><i className="bi bi-send" /></button></div></div>}</>;
}

// ===== MA CU TRUOC KHI SUA - CHI GIU DE DOI CHIEU, KHONG THUC THI =====
// import {useState} from 'react';import api from '../services/api';
// export default function AIChat(){const [open,setOpen]=useState(false),[text,setText]=useState(''),[messages,setMessages]=useState([{who:'ai',text:'Xin chào! Mình là DopTech AI. Bạn cần tư vấn laptop, điện thoại hay linh kiện theo ngân sách?'}]),[loading,setLoading]=useState(false);const send=async()=>{const q=text.trim();if(!q||loading)return;setText('');setMessages(m=>[...m,{who:'me',text:q}]);setLoading(true);try{const r=await api.post('/ai/chat',{message:q});setMessages(m=>[...m,{who:'ai',text:r.data.data.answer,products:r.data.data.recommendedProducts,mode:r.data.data.mode}])}catch(e){setMessages(m=>[...m,{who:'ai',text:e.response?.data?.message||'DopTech AI đang bận. Vui lòng thử lại.'}])}finally{setLoading(false)}};return <><button className="ai-fab" onClick={()=>setOpen(v=>!v)}><i className="bi bi-stars"/> <span>DopTech AI</span></button>{open&&<div className="ai-panel"><div className="ai-head"><strong><i className="bi bi-stars"/> DopTech AI</strong><button className="btn-close btn-close-white" onClick={()=>setOpen(false)}/></div><div className="ai-body">{messages.map((m,i)=><div key={i} className={`ai-msg ${m.who}`}><div>{m.text}</div>{m.products?.length>0&&<div className="mt-2">{m.products.map(p=><a key={p.ProductID} href={`/products/${p.Slug}`} className="ai-product">{p.ProductName}</a>)}</div>}{m.mode&&<small className="opacity-75">Chế độ: {m.mode}</small>}</div>)}{loading&&<div className="ai-msg ai">Đang tìm sản phẩm thật trong DopTech...</div>}</div><div className="ai-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="VD: laptop dưới 20 triệu học IT"/><button onClick={send}><i className="bi bi-send"/></button></div></div>}</>}
// 
// ===== HET MA CU =====
