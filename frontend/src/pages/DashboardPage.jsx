import { useEffect, useState } from 'react';
import { ShoppingCart, CheckCircle, Clock, Users, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUS_BADGE = { pending: 'badge-pending', processing: 'badge-processing', completed: 'badge-completed', cancelled: 'badge-cancelled' };

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="card flex items-center gap-4 animate-fade-in">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {loading ? (
          <div className="skeleton h-6 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold mt-0.5 leading-none">{value}</p>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4].map(i => (
        <td key={i} className="px-4 py-3"><div className="skeleton h-4 rounded w-20" /></td>
      ))}
    </tr>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : '—';
  const fmtCurrency = (n) => typeof n === 'number' ? `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—';

  const stats = [
    { icon: ShoppingCart, label: 'Total Orders', value: fmt(data?.totalOrders), color: 'bg-black' },
    { icon: Clock, label: 'Pending', value: fmt(data?.pendingOrders), color: 'bg-amber-500' },
    { icon: CheckCircle, label: 'Completed', value: fmt(data?.completedOrders), color: 'bg-emerald-500' },
    { icon: XCircle, label: 'Cancelled', value: fmt(data?.cancelledOrders), color: 'bg-red-400' },
    ...(can('manage_users') ? [
      { icon: Users, label: 'Total Users', value: fmt(data?.totalUsers), color: 'bg-violet-500' },
      { icon: TrendingUp, label: 'Revenue', value: fmtCurrency(data?.totalRevenue), color: 'bg-sky-500' },
    ] : [
      { icon: TrendingUp, label: 'Processing', value: fmt(data?.processingOrders), color: 'bg-blue-500' },
    ]),
  ];

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <XCircle size={24} className="text-red-400" />
      </div>
      <p className="font-medium text-gray-800">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-secondary mt-4 text-sm">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Good day, {user?.name?.split(' ')[0]}. Here's what's happening.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} loading={loading} />
        ))}
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <a href="/orders" className="text-xs text-gray-500 hover:text-black transition-colors">View all →</a>
        </div>

        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Order #', 'Customer', 'Amount', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>{[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : data?.recentOrders?.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['Order #', 'Customer', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.map(o => (
                  <tr key={o.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3 font-mono text-xs font-medium">{o.order_number}</td>
                    <td className="px-5 py-3">{o.customer_name}</td>
                    <td className="px-5 py-3 font-medium">₹{parseFloat(o.total_amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
