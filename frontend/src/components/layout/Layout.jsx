import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard/admin':   'Dashboard',
  '/dashboard/manager': 'Dashboard',
  '/dashboard/staff':   'Dashboard',
  '/orders':  'Orders',
  '/users':   'Users',
  '/reports': 'Reports',
  '/masters/relationships':            'Relationships',
  '/masters/medical-conditions':       'Medical Conditions',
  '/masters/medical-record-categories':'Medical Record Categories',
  '/masters/medical-record-tags':      'Medical Record Tags',
  '/masters/specialties':              'Specialties',
  '/masters/user-roles':               'User Roles',
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Desktop sidebar */}
      <aside style={{ width:240, flexShrink:0, display:'none' }} className="lg-sidebar">
        <Sidebar />
      </aside>
      <style>{`@media(min-width:1024px){.lg-sidebar{display:flex !important;flex-direction:column;}}`}</style>

      {/* Mobile overlay */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:40 }} className="animate-fade-in">
          <div
            style={{ position:'absolute', inset:0, background:'rgba(26,23,20,0.4)', backdropFilter:'blur(8px)' }}
            onClick={() => setOpen(false)}
          />
          <aside style={{ position:'relative', zIndex:50, width:260, height:'100%' }} className="animate-slide-in">
            <Sidebar onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button
              onClick={() => setOpen(true)}
              className="btn btn-ghost btn-icon lg-hide"
              style={{ display:'flex' }}
            >
              <Menu size={20} />
            </button>
            <style>{`@media(min-width:1024px){.lg-hide{display:none !important;}}`}</style>
            <div>
              <h1 style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.2px', color:'var(--text-1)' }}>{title}</h1>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="topbar-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', padding:'24px 20px', background:'var(--bg)' }}>
          <div style={{ maxWidth:1200, margin:'0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
