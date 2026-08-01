import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';

const COLORS = { Completed:'#16a34a', Pending:'#ea580c', Processing:'#2563eb', Cancelled:'#dc2626' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:`1px solid var(--border)`, borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)', fontSize:13 }}>
      <p style={{ fontWeight:600, marginBottom:4 }}>{label || payload[0].name}</p>
      <p style={{ color:'var(--text-2)' }}>{payload[0].value} orders</p>
    </div>
  );
};

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/summary').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div><div className="skeleton" style={{ height:28, width:120, borderRadius:8, marginBottom:6 }} /><div className="skeleton" style={{ height:16, width:200, borderRadius:6 }} /></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {[1,2].map(i=><div key={i} className="card skeleton" style={{ height:280 }} />)}
      </div>
    </div>
  );

  const pieData = [
    { name:'Completed', value:data?.completedOrders||0 },
    { name:'Pending',   value:data?.pendingOrders||0 },
    { name:'Processing',value:data?.processingOrders||0 },
    { name:'Cancelled', value:data?.cancelledOrders||0 },
  ].filter(d=>d.value>0);

  const barData = [
    { label:'Pending',    count:data?.pendingOrders||0,    fill:'#ea580c' },
    { label:'Processing', count:data?.processingOrders||0, fill:'#2563eb' },
    { label:'Completed',  count:data?.completedOrders||0,  fill:'#16a34a' },
    { label:'Cancelled',  count:data?.cancelledOrders||0,  fill:'#dc2626' },
  ];

  const summaryCards = [
    { label:'Total Orders',  value:data?.totalOrders,      color:'#0f0f0f', bg:'#f5f5f7' },
    { label:'Completed',     value:data?.completedOrders,  color:'#16a34a', bg:'#f0fdf4' },
    { label:'Pending',       value:data?.pendingOrders,    color:'#ea580c', bg:'#fff7ed' },
    { label:'Processing',    value:data?.processingOrders, color:'#2563eb', bg:'#eff6ff' },
  ];

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Reports</h1>
        <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>Order analytics and performance overview</p>
      </div>

      {/* Summary cards */}
      <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
        {summaryCards.map(({ label, value, color, bg }) => (
          <div key={label} className="card animate-slide-up" style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:14, height:14, borderRadius:'50%', background:color }} />
            </div>
            <p style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.5px', color }}>{value ?? '—'}</p>
            <p style={{ fontSize:12, color:'var(--text-3)', fontWeight:500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <style>{`@media(max-width:768px){.chart-grid{grid-template-columns:1fr !important;}}`}</style>
        <div className="card chart-grid">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:20 }}>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top:0, right:0, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:12, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {barData.map((entry,i)=><Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-grid">
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:20 }}>Status Distribution</h3>
          {pieData.length === 0 ? (
            <div style={{ height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <p style={{ fontSize:13, color:'var(--text-3)' }}>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry,i)=><Cell key={i} fill={COLORS[entry.name]||'#6b7280'} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={v=><span style={{ fontSize:12, color:'var(--text-2)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Revenue card (Super Admin only) */}
      {data?.totalRevenue !== undefined && (
        <div style={{ background:'linear-gradient(135deg,#0f0f0f 0%,#1a1a2e 100%)', borderRadius:16, padding:'24px 28px', color:'#fff' }}>
          <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Total Revenue</p>
          <p style={{ fontSize:36, fontWeight:800, letterSpacing:'-1px' }}>₹{data.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits:0 })}</p>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginTop:8 }}>Across {data.totalOrders} orders</p>
        </div>
      )}
    </div>
  );
}
