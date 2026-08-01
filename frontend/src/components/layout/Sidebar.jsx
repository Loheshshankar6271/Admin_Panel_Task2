import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, BarChart3, LogOut, X, Zap, Heart, Activity, Stethoscope, Tag, Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_HOME  = { super_admin: '/dashboard/admin', manager: '/dashboard/manager', staff: '/dashboard/staff' };
const PANEL_LABEL = { super_admin: 'Admin Panel', manager: 'Manager Panel', staff: 'Staff Panel' };
const ROLE_LABEL  = { super_admin: 'Super Admin', manager: 'Manager', staff: 'Staff' };
const ROLE_COLOR  = { super_admin: 'badge-super_admin', manager: 'badge-manager', staff: 'badge-staff' };

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const NAV = [
    { to: ROLE_HOME[user?.role] || '/dashboard/staff', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin','manager','staff'] },
    { to: '/users',   icon: Users,        label: 'Users',   roles: ['super_admin'] },
    { to: '/orders',  icon: ShoppingCart, label: 'Orders',  roles: ['super_admin','manager','staff'] },
    { to: '/reports', icon: BarChart3,    label: 'Reports', roles: ['super_admin','manager'] },
  ].filter(n => n.roles.includes(user?.role));

  // Master Data — each screen now reads directly from the public,
  // read-only Task 2 Extension API (GET /api/<endpoint>).
  const MASTERS_NAV = [
    { to: '/masters/relationships',            icon: Heart,       label: 'Relationships',           roles: ['super_admin','manager'] },
    { to: '/masters/medical-conditions',       icon: Activity,    label: 'Medical Conditions',      roles: ['super_admin','manager'] },
    { to: '/masters/medical-record-categories', icon: Layers,      label: 'Medical Record Categories', roles: ['super_admin','manager'] },
    { to: '/masters/medical-record-tags',      icon: Tag,         label: 'Medical Record Tags',     roles: ['super_admin','manager'] },
    { to: '/masters/specialties',              icon: Stethoscope, label: 'Specialties',              roles: ['super_admin','manager'] },
    { to: '/masters/user-roles',               icon: ShieldCheck, label: 'User Roles',               roles: ['super_admin','manager'] },
  ].filter(n => n.roles.includes(user?.role));

  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login'); };
  const panelLabel = PANEL_LABEL[user?.role] || 'Panel';

  return (
    <div className="sidebar-root">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="sidebar-icon-box">
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p className="sidebar-panel-name">{panelLabel}</p>
            <p className="sidebar-version">v2.0</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ display:'flex' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Navigation</p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={onClose}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon"><Icon size={15} strokeWidth={2} /></span>
            <span>{label}</span>
          </NavLink>
        ))}

        {MASTERS_NAV.length > 0 && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: 16 }}>Master Data</p>
            {MASTERS_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} onClick={onClose}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <span className="sidebar-link-icon"><Icon size={15} strokeWidth={2} /></span>
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth:0 }}>
            <p className="sidebar-user-name">{user?.name}</p>
            <span className={`badge ${ROLE_COLOR[user?.role]}`} style={{ marginTop:2 }}>
              {ROLE_LABEL[user?.role]}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
