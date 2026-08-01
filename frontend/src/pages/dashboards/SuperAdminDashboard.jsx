import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CheckCircle, Clock, Users, TrendingUp, XCircle, UserCheck, ArrowRight, BarChart3, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const SB = { pending:'badge-pending', processing:'badge-processing', completed:'badge-completed', cancelled:'badge-cancelled' };

function Stat({ icon: Icon, label, value, color, bg, sub, loading, onClick }) {
  return (
    <div
      className={`stat-card animate-slide-up${onClick ? ' card-hover' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:16 }}
    >
      <div style={{
        width:44, height:44, borderRadius:12, background: bg || color,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        border:`1px solid ${color}22`
      }}>
        <Icon size={20} color={color} strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontSize:12, color:'var(--text-4)', fontWeight:500 }}>{label}</p>
        {loading
          ? <div className="skeleton" style={{ height:24, width:60, marginTop:4 }} />
          : <p style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px', marginTop:2, color:'var(--text-1)' }}>{value}</p>
        }
        {sub && !loading && <p style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed'))
      .finally(() => setLoading(false));
  }, []);

  const fmt   = n => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';
  const fmtRs = n => typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits:0 })}` : '—';

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Hero header — dark Claude-branded gradient */}
      <div style={{
        background:'linear-gradient(135deg, #1A1714 0%, #2D2926 60%, #3D3530 100%)',
        borderRadius:'var(--radius-lg)',
        padding:'26px 28px',
        color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:16,
        boxShadow:'0 4px 24px rgba(26,23,20,0.22)',
        position:'relative', overflow:'hidden'
      }}>
        {/* warm accent glow */}
        <div style={{
          position:'absolute', top:-60, right:-60,
          width:220, height:220, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(201,100,66,0.18) 0%, transparent 70%)',
          pointerEvents:'none'
        }} />
        <div style={{ position:'relative' }}>
          <p style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', marginBottom:8 }}>
            Admin Panel
          </p>
          <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>
            Good day, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginTop:5 }}>
            You have full control of the system.
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', position:'relative' }}>
          {[
            { label:'Manage Users', icon:Users, path:'/users' },
            { label:'Reports',      icon:BarChart3, path:'/reports' },
          ].map(({ label, icon:Icon, path }) => (
            <button key={path} onClick={() => navigate(path)} className="btn" style={{
              background:'rgba(255,255,255,0.1)',
              color:'#fff',
              border:'1px solid rgba(255,255,255,0.15)',
              backdropFilter:'blur(8px)',
              transition:'all 0.2s ease'
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.18)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)';  e.currentTarget.style.transform='translateY(0)'; }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background:'#FDEDEF', border:'1px solid #F5C2C6',
          borderRadius:10, padding:'12px 16px',
          color:'#A8202C', fontSize:13
        }}>{error}</div>
      )}

      {/* Users & Revenue */}
      <div>
        <p style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--text-4)', marginBottom:12 }}>
          Overview
        </p>
        <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
          <Stat icon={Users}      label="Total Users"   value={fmt(data?.totalUsers)}    color="#6B2DAB" bg="#F5EDFD" loading={loading} onClick={() => navigate('/users')} />
          <Stat icon={UserCheck}  label="Active Users"  value={fmt(data?.activeUsers)}   color="#1A6A2A" bg="#EDF7ED" loading={loading} />
          <Stat icon={TrendingUp} label="Total Revenue" value={fmtRs(data?.totalRevenue)} color="#0369A1" bg="#E0F2FE" loading={loading} />
          <Stat icon={ShoppingCart} label="Total Orders" value={fmt(data?.totalOrders)} color="#1A1714" bg="#F0EDE8" loading={loading} onClick={() => navigate('/orders')} />
        </div>
      </div>

      {/* Order Status */}
      <div>
        <p style={{ fontSize:10.5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.09em', color:'var(--text-4)', marginBottom:12 }}>
          Order Status
        </p>
        <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
          <Stat icon={Clock}       label="Pending"    value={fmt(data?.pendingOrders)}    color="#B7540A" bg="#FDF6EC" loading={loading} />
          <Stat icon={Loader2}     label="Processing" value={fmt(data?.processingOrders)} color="#1A4EBD" bg="#EEF3FD" loading={loading} />
          <Stat icon={CheckCircle} label="Completed"  value={fmt(data?.completedOrders)}  color="#1A6A2A" bg="#EDF7ED" loading={loading} />
          <Stat icon={XCircle}     label="Cancelled"  value={fmt(data?.cancelledOrders)}  color="#A8202C" bg="#FDEDEF" loading={loading} />
        </div>
      </div>

      {/* Bottom grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <style>{`@media(max-width:900px){.sa-bottom{grid-template-columns:1fr !important;}}`}</style>

        {/* Recent orders */}
        <div className="card sa-bottom" style={{ padding:0, overflow:'hidden' }}>
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
            ? <div style={{ textAlign:'center', padding:'44px 20px' }}>
                <ShoppingCart size={30} color="var(--text-4)" style={{ margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, color:'var(--text-4)', fontWeight:500 }}>No orders yet</p>
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

        {/* Quick actions */}
        <div className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:4, color:'var(--text-1)' }}>Quick Actions</h3>
          {[
            { icon:Plus,         label:'Add New User',  sub:'Create & assign roles',    path:'/users',   bg:'#F5EDFD', ic:'#6B2DAB' },
            { icon:ShoppingCart, label:'All Orders',    sub:'Browse & manage',          path:'/orders',  bg:'#EEF3FD', ic:'#1A4EBD' },
            { icon:BarChart3,    label:'View Reports',  sub:'Analytics & revenue',      path:'/reports', bg:'#EDF7ED', ic:'#1A6A2A' },
          ].map(({ icon:Icon, label, sub, path, bg, ic }) => (
            <button
              key={path} onClick={() => navigate(path)}
              style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'11px 13px', borderRadius:10,
                border:'1px solid var(--border)', textAlign:'left',
                width:'100%', cursor:'pointer',
                background:'transparent',
                transition:'all 0.2s ease',
                position:'relative', overflow:'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-subtle)';
                e.currentTarget.style.borderColor = 'var(--claude-tan)';
                e.currentTarget.style.transform = 'translateX(3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{
                width:37, height:37, borderRadius:9, background:bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, border:`1px solid ${ic}22`
              }}>
                <Icon size={16} color={ic} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-1)' }}>{label}</p>
                <p style={{ fontSize:11.5, color:'var(--text-4)' }}>{sub}</p>
              </div>
              <ArrowRight size={14} color="var(--text-4)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
