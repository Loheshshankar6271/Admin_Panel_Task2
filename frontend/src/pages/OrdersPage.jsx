import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, Loader2, ShoppingCart, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import AddOrderModal from '../components/orders/AddOrderModal';

const SB = { pending:'badge-pending', processing:'badge-processing', completed:'badge-completed', cancelled:'badge-cancelled' };
const STATUSES = ['','pending','processing','completed','cancelled'];

function EditModal({ order, onClose, onSave }) {
  const [form, setForm] = useState({ customer_name:order.customer_name, customer_email:order.customer_email||'', status:order.status, total_amount:order.total_amount, notes:order.notes||'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    setSaving(true);
    try { await api.put(`/orders/${order.id}`, form); toast.success('Order updated'); onSave(); onClose(); }
    catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid var(--border)` }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700 }}>Edit Order</h3>
            <p style={{ fontSize:12, color:'var(--text-3)' }}>{order.order_number}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16}/></button>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          {[['Customer Name','customer_name','text'],['Customer Email','customer_email','email'],['Total Amount (₹)','total_amount','number']].map(([label,key,type])=>(
            <div key={key}>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>{label}</label>
              <input type={type} className="input" value={form[key]} onChange={e=>set(key,e.target.value)} />
            </div>
          ))}
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Status</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {['pending','processing','completed','cancelled'].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Notes</label>
            <textarea className="input" rows={3} style={{ resize:'vertical' }} value={form.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>
        <div style={{ display:'flex', gap:8, padding:'16px 24px', borderTop:`1px solid var(--border)` }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
            {saving && <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} />} Save Changes
          </button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid var(--border)` }}>
          <h3 style={{ fontSize:15, fontWeight:700 }}>Order Details</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16}/></button>
        </div>
        <div style={{ padding:'20px 24px' }}>
          {[['Order Number',order.order_number],['Customer',order.customer_name],['Email',order.customer_email||'—'],['Amount',`₹${parseFloat(order.total_amount).toLocaleString('en-IN')}`],['Notes',order.notes||'—'],['Created',new Date(order.created_at).toLocaleString('en-IN')]].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:`1px solid var(--border)`, fontSize:13 }}>
              <span style={{ color:'var(--text-2)', fontWeight:500 }}>{k}</span>
              <span style={{ fontWeight:600, maxWidth:'60%', textAlign:'right' }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', fontSize:13 }}>
            <span style={{ color:'var(--text-2)', fontWeight:500 }}>Status</span>
            <span className={`badge ${SB[order.status]}`}>{order.status}</span>
          </div>
        </div>
        <div style={{ padding:'16px 24px', borderTop:`1px solid var(--border)` }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ width:'100%', justifyContent:'center' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { can } = useAuth();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [page, setPage] = useState(1);
  const [editOrder, setEditOrder] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/orders', { params:{ page, limit, search, status, sort, order:sortDir } })
      .then(r => { setOrders(r.data.orders); setTotal(r.data.total); })
      .catch(e => toast.error(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [page, search, status, sort, sortDir]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    try { await api.delete(`/orders/${id}`); toast.success('Order deleted'); load(); }
    catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleSort = col => {
    if (sort === col) setSortDir(d => d==='ASC'?'DESC':'ASC');
    else { setSort(col); setSortDir('DESC'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {editOrder && <EditModal order={editOrder} onClose={()=>setEditOrder(null)} onSave={load} />}
      {viewOrder && <ViewModal order={viewOrder} onClose={()=>setViewOrder(null)} />}
      {showAdd && <AddOrderModal onClose={()=>setShowAdd(false)} onSave={()=>{ setShowAdd(false); load(); toast.success('Order created!'); }} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Orders</h1>
          <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>{total} total orders</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="btn btn-primary"><Plus size={15}/> New Order</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ display:'flex', gap:10, flexWrap:'wrap', padding:'14px 16px' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft:32 }} placeholder="Search customer or order number..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div style={{ position:'relative' }}>
          <Filter size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
          <select className="input" style={{ paddingLeft:30, width:160 }} value={status} onChange={e=>setStatus(e.target.value)}>
            {STATUSES.map(s=><option key={s} value={s}>{s ? s.charAt(0).toUpperCase()+s.slice(1) : 'All statuses'}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid var(--border)`, background:'var(--bg)' }}>
                {[['order_number','Order #'],['customer_name','Customer'],['total_amount','Amount'],['status','Status'],['created_at','Date']].map(([col,label])=>(
                  <th key={col} onClick={()=>toggleSort(col)} style={{ textAlign:'left', padding:'11px 20px', fontSize:11.5, fontWeight:600, color:'var(--text-3)', cursor:'pointer', whiteSpace:'nowrap', userSelect:'none' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                      {label}
                      <ArrowUpDown size={11} style={{ color: sort===col ? 'var(--text-1)' : 'var(--text-3)' }} />
                    </span>
                  </th>
                ))}
                <th style={{ padding:'11px 20px', fontSize:11.5, fontWeight:600, color:'var(--text-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid var(--border)` }}>
                  {[...Array(6)].map((_,j)=><td key={j} style={{ padding:'14px 20px' }}><div className="skeleton" style={{ height:14, borderRadius:4, width:j===1?120:j===2?60:80 }} /></td>)}
                </tr>
              )) : orders.length===0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'60px 20px' }}>
                  <ShoppingCart size={32} color="var(--text-3)" style={{ margin:'0 auto 10px' }} />
                  <p style={{ fontSize:14, fontWeight:500, color:'var(--text-2)' }}>No orders found</p>
                  <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>Try adjusting your search or filters</p>
                </td></tr>
              ) : orders.map(o=>(
                <tr key={o.id} className="table-row" style={{ borderBottom:`1px solid var(--border)` }}>
                  <td style={{ padding:'13px 20px', fontFamily:'monospace', fontSize:12, fontWeight:700 }}>{o.order_number}</td>
                  <td style={{ padding:'13px 20px' }}>
                    <p style={{ fontWeight:600 }}>{o.customer_name}</p>
                    {o.customer_email && <p style={{ fontSize:11.5, color:'var(--text-3)' }}>{o.customer_email}</p>}
                  </td>
                  <td style={{ padding:'13px 20px', fontWeight:700 }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                  <td style={{ padding:'13px 20px' }}><span className={`badge ${SB[o.status]}`}>{o.status}</span></td>
                  <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)', whiteSpace:'nowrap' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding:'13px 20px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>setViewOrder(o)} className="btn btn-ghost btn-icon" title="View"><Eye size={15} /></button>
                      {can('edit_orders') && <button onClick={()=>setEditOrder(o)} className="btn btn-ghost btn-icon" title="Edit"><Pencil size={15} /></button>}
                      {can('delete_orders') && (
                        <button onClick={()=>handleDelete(o.id)} className="btn btn-icon" title="Delete"
                          style={{ background:'transparent', color:'#ef4444', border:'none', cursor:'pointer', padding:7, borderRadius:8 }}
                          onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:`1px solid var(--border)` }}>
            <p style={{ fontSize:12, color:'var(--text-3)' }}>
              Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}
            </p>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="btn btn-secondary btn-sm" style={{ padding:'6px 10px' }}>
                <ChevronLeft size={14} />
              </button>
              {[...Array(Math.min(totalPages,5))].map((_,i)=>{
                const p = i+1;
                return <button key={p} onClick={()=>setPage(p)} className="btn btn-sm"
                  style={{ padding:'6px 10px', background: page===p ? '#0f0f0f' : '#fff', color: page===p ? '#fff' : 'var(--text-1)', border:`1px solid ${page===p?'#0f0f0f':'var(--border)'}` }}>{p}</button>;
              })}
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="btn btn-secondary btn-sm" style={{ padding:'6px 10px' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
