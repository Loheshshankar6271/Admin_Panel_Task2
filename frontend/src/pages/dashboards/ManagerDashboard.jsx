import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, Clock, XCircle, ArrowRight, BarChart3, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import AddOrderModal from '../../components/orders/AddOrderModal';
import toast from 'react-hot-toast';

const SB = { pending:'badge-pending', processing:'badge-processing', completed:'badge-completed', cancelled:'badge-cancelled' };
const PIPE = [
  { key:'pendingOrders',    label:'Pending',    icon:Clock,       color:'#B7540A', bg:'#FDF6EC', bar:'#EA580C' },
  { key:'processingOrders', label:'Processing', icon:Loader2,     color:'#1A4EBD', bg:'#EEF3FD', bar:'#2563EB' },
  { key:'completedOrders',  label:'Completed',  icon:CheckCircle, color:'#1A6A2A', bg:'#EDF7ED', bar:'#16A34A' },
  { key:'cancelledOrders',  label:'Cancelled',  icon:XCircle,     color:'#A8202C', bg:'#FDEDEF', bar:'#DC2626' },
];

export default function ManagerDashboard() {
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

  const total = data?.totalOrders || 0;
  const pct = n => total > 0 ? Math.round(((n||0)/total)*100) : 0;
  const fmt = n => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {showAdd && (
        <AddOrderModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); load(); toast.success('Order created!'); }}
        />
      )}

      {/* Page hero */}
      <div className="page-hero animate-slide-up">
        <div>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'#EEF3FD', color:'#1A4EBD',
            fontSize:11.5, fontWeight:600, padding:'3px 11px',
            borderRadius:99, marginBottom:10,
            border:'1px solid #C3D4F7'
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#2563EB', display:'inline-block' }} />
            Manager Access
          </div>
          <h2 style={{ fontSize:21, fontWeight:700, letterSpacing:'-0.4px', color:'var(--text-1)' }}>
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize:13, color:'var(--text-3)', marginTop:4 }}>Monitor and manage your orders pipeline.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">
            <Plus size={15} /> New Order
          </button>
          <button onClick={() => navigate('/orders')} className="btn btn-secondary">
            <ShoppingCart size={14} /> All Orders
          </button>
        </div>
      </div>

      {/* Pipeline cards */}
      <div>
        <p style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--text-4)', marginBottom:12 }}>
          Orders Pipeline
        </p>
        <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(185px,1fr))', gap:12 }}>
          {PIPE.map(({ key, label, icon:Icon, color, bg, bar }, i) => (
            <div key={key} className="stat-card animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{
                  width:40, height:40, borderRadius:11, background:bg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:`1px solid ${color}22`
                }}>
                  <Icon size={18} color={color} />
                </div>
                {!loading && (
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--text-4)' }}>{pct(data?.[key])}%</span>
                )}
              </div>
              {loading
                ? <div className="skeleton" style={{ height:26, width:55, borderRadius:6, marginBottom:6 }} />
                : <p style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.5px', color:'var(--text-1)' }}>
                    {fmt(data?.[key])}
                  </p>
              }
              <p style={{ fontSize:12.5, color:'var(--text-3)', marginTop:3, fontWeight:500 }}>{label}</p>
              {!loading && (
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width:`${pct(data?.[key])}%`, background:bar }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>
        <style>{`@media(max-width:900px){.mgr-grid{grid-template-columns:1fr !important;}}`}</style>
        <div className="card mgr-grid" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-1)' }}>Summary</h3>
          <div style={{
            background:'var(--bg-subtle)', borderRadius:11,
            padding:'13px 15px', display:'flex', alignItems:'center', gap:12,
            border:'1px solid var(--border)'
          }}>
            <div style={{
              width:38, height:38, borderRadius:10,
              background:'linear-gradient(135deg,var(--claude-dark),var(--claude-charcoal))',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <ShoppingCart size={16} color="#fff" />
            </div>
            <div>
              {loading
                ? <div className="skeleton" style={{ height:20, width:44 }} />
                : <p style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.4px' }}>{fmt(data?.totalOrders)}</p>
              }
              <p style={{ fontSize:11.5, color:'var(--text-4)', fontWeight:500 }}>Total Orders</p>
            </div>
          </div>
          {PIPE.map(({ key, label, bar }) => (
            <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:bar, display:'inline-block', flexShrink:0 }} />
                <span style={{ color:'var(--text-3)', fontWeight:500 }}>{label}</span>
              </div>
              {loading
                ? <div className="skeleton" style={{ height:14, width:26 }} />
                : <span style={{ fontWeight:700, color:'var(--text-1)' }}>{data?.[key] ?? 0}</span>
              }
            </div>
          ))}
          <button onClick={() => navigate('/reports')} className="btn btn-secondary" style={{ marginTop:'auto', justifyContent:'center' }}>
            <BarChart3 size={13} /> Full Report
          </button>
        </div>

        {/* Recent orders table */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'16px 20px', borderBottom:'1px solid var(--border)',
            background:'rgba(250,249,247,0.6)'
          }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-1)' }}>Recent Orders</h3>
            <button onClick={() => navigate('/orders')} className="btn btn-ghost btn-sm" style={{ gap:4 }}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading
            ? <div style={{ padding:20, display:'flex', flexDirection:'column', gap:10 }}>
                {[...Array(4)].map((_,i) => <div key={i} className="skeleton" style={{ height:46, borderRadius:8 }} />)}
              </div>
            : !data?.recentOrders?.length
            ? <div style={{ textAlign:'center', padding:'48px 20px' }}>
                <ShoppingCart size={30} color="var(--text-4)" style={{ margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, color:'var(--text-4)', fontWeight:500 }}>No recent orders</p>
              </div>
            : <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-subtle)' }}>
                      {['Order #','Customer','Amount','Status'].map(h => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>
    </div>
  );
}
