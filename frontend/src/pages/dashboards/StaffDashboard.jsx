import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, Clock, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import AddOrderModal from '../../components/orders/AddOrderModal';
import toast from 'react-hot-toast';

const SB = { pending:'badge-pending', processing:'badge-processing', completed:'badge-completed', cancelled:'badge-cancelled' };

export default function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/dashboard/summary').then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fmt = n => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); load(); toast.success('Order placed!'); }}
        />
      )}

      {/* Page hero */}
      <div className="page-hero animate-slide-up">
        <div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#EDF7ED', color:'#1A6A2A',
            fontSize:11.5, fontWeight:600, padding:'3px 11px',
            borderRadius:99, marginBottom:10,
            border:'1px solid #B8DFB8'
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#16A34A', display:'inline-block' }} />
            Staff Access
          </div>
          <h2 style={{ fontSize:21, fontWeight:700, letterSpacing:'-0.4px', color:'var(--text-1)' }}>
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>
            Place and view orders. Contact your manager to edit or delete them.
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={15} /> Place New Order
          </button>
          <button onClick={() => navigate('/orders')} className="btn btn-secondary">
            <ShoppingCart size={14} /> View All Orders
          </button>
        </div>
      </div>

      {/* Limited access notice */}
      <div style={{
        background:'rgba(253,246,236,0.8)',
        backdropFilter:'blur(8px)',
        border:'1px solid #F5D9B8',
        borderRadius:'var(--radius)',
        padding:'13px 16px',
        display:'flex', gap:12, alignItems:'flex-start'
      }}>
        <div style={{
          width:22, height:22, borderRadius:'50%',
          background:'#EA580C',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, marginTop:1
        }}>
          <AlertCircle size={13} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#7C2D12' }}>Limited Access</p>
          <p style={{ fontSize:12.5, color:'#9A3412', marginTop:2, lineHeight:1.5 }}>
            You can place and view orders. Editing or deleting requires Manager or Super Admin access.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:12 }}>
        {[
          { icon:ShoppingCart, label:'Total Orders',  key:'totalOrders',    color:'var(--claude-dark)',  bg:'var(--claude-warm)', bar:'#1A1714' },
          { icon:Clock,        label:'Pending',       key:'pendingOrders',  color:'#B7540A',             bg:'#FDF6EC',            bar:'#EA580C' },
          { icon:CheckCircle,  label:'Completed',     key:'completedOrders',color:'#1A6A2A',             bg:'#EDF7ED',            bar:'#16A34A' },
        ].map(({ icon:Icon, label, key, color, bg, bar }, i) => (
          <div key={key} className="stat-card animate-slide-up" style={{ animationDelay:`${i*70}ms` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{
                width:44, height:44, borderRadius:12, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, border:`1px solid ${color}22`
              }}>
                <Icon size={19} color={color} />
              </div>
              <div>
                <p style={{ fontSize:12, color:'var(--text-4)', fontWeight:500 }}>{label}</p>
                {loading
                  ? <div className="skeleton" style={{ height:24, width:52, marginTop:4 }} />
                  : <p style={{ fontSize:22, fontWeight:800, marginTop:3, letterSpacing:'-0.4px', color:'var(--text-1)' }}>
                      {fmt(data?.[key])}
                    </p>
                }
              </div>
            </div>
            {!loading && (
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{
                  width:'100%', background:bar, opacity:0.25
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 20px', borderBottom:'1px solid var(--border)',
          background:'rgba(250,249,247,0.6)'
        }}>
          <div>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-1)' }}>Recent Orders</h3>
            <p style={{ fontSize:12, color:'var(--text-4)', marginTop:2 }}>View only — contact manager to edit</p>
          </div>
          <button onClick={() => navigate('/orders')} className="btn btn-ghost btn-sm" style={{ gap:4 }}>
            All orders <ArrowRight size={13} />
          </button>
        </div>

        {loading
          ? <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
              {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:46, borderRadius:8 }} />)}
            </div>
          : !data?.recentOrders?.length
          ? <div style={{ textAlign:'center', padding:'52px 20px' }}>
              <ShoppingCart size={32} color="var(--text-4)" style={{ margin:'0 auto 12px' }} />
              <p style={{ fontSize:14, fontWeight:600, color:'var(--text-2)' }}>No orders yet</p>
              <p style={{ fontSize:13, color:'var(--text-4)', marginTop:4 }}>Place your first order above</p>
            </div>
          : <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
                    {['Order #','Customer','Amount','Status','Date'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'10px 20px', fontSize:11.5, fontWeight:600, color:'var(--text-4)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map(o => (
                    <tr key={o.id} className="table-row" style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'13px 20px', fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--text-2)' }}>{o.order_number}</td>
                      <td style={{ padding:'13px 20px', fontWeight:500, color:'var(--text-1)' }}>{o.customer_name}</td>
                      <td style={{ padding:'13px 20px', fontWeight:700, color:'var(--text-1)' }}>₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                      <td style={{ padding:'13px 20px' }}><span className={`badge ${SB[o.status]}`}>{o.status}</span></td>
                      <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-4)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  );
}
