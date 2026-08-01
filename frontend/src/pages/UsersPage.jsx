import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, Users, X, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const RB = { super_admin:'badge-super_admin', manager:'badge-manager', staff:'badge-staff' };
const RL = { super_admin:'Super Admin', manager:'Manager', staff:'Staff' };

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState(user ? { name:user.name, email:user.email, role:user.role, password:'' } : { name:'', email:'', role:'staff', password:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.name || !form.email || (!isEdit && !form.password)) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      if (isEdit) await api.put(`/users/${user.id}`, { name:form.name, email:form.email, role:form.role });
      else await api.post('/users', form);
      toast.success(isEdit ? 'User updated' : 'User created');
      onSave(); onClose();
    } catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid var(--border)` }}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:700 }}>{isEdit ? 'Edit User' : 'Add New User'}</h3>
            <p style={{ fontSize:12, color:'var(--text-3)' }}>{isEdit ? `Editing ${user.name}` : 'Create a new team member'}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16}/></button>
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Full Name *</label>
            <input className="input" placeholder="John Doe" value={form.name} onChange={e=>set('name',e.target.value)} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Email *</label>
            <input type="email" className="input" placeholder="john@example.com" value={form.email} onChange={e=>set('email',e.target.value)} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Role *</label>
            <select className="input" value={form.role} onChange={e=>set('role',e.target.value)}>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {!isEdit && (
            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Password *</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} />
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, padding:'16px 24px', borderTop:`1px solid var(--border)` }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
            {saving && <Loader2 size={14} />} {isEdit ? 'Save Changes' : 'Create User'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const limit = 10;

  const load = useCallback(() => {
    setLoading(true);
    api.get('/users', { params:{ page, limit, search, role:roleFilter } })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(e => toast.error(e.response?.data?.error || 'Failed'))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deleted'); load(); }
    catch(err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleToggle = async (u) => {
    try { await api.put(`/users/${u.id}`, { is_active:!u.is_active }); toast.success(u.is_active ? 'User deactivated' : 'User activated'); load(); }
    catch { toast.error('Failed'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {modal && <UserModal user={modal==='add'?null:modal} onClose={()=>setModal(null)} onSave={load} />}

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.4px' }}>Users</h1>
          <p style={{ fontSize:13, color:'var(--text-3)', marginTop:2 }}>{total} total users</p>
        </div>
        <button onClick={()=>setModal('add')} className="btn btn-primary"><Plus size={15}/> Add User</button>
      </div>

      <div className="card" style={{ display:'flex', gap:10, flexWrap:'wrap', padding:'14px 16px' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)' }} />
          <input className="input" style={{ paddingLeft:32 }} placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width:160 }} value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:`1px solid var(--border)`, background:'var(--bg)' }}>
                {['Name','Email','Role','Status','Joined','Actions'].map(h=>(
                  <th key={h} style={{ textAlign:'left', padding:'11px 20px', fontSize:11.5, fontWeight:600, color:'var(--text-3)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_,i)=>(
                <tr key={i} style={{ borderBottom:`1px solid var(--border)` }}>
                  {[...Array(6)].map((_,j)=><td key={j} style={{ padding:'14px 20px' }}><div className="skeleton" style={{ height:14, borderRadius:4, width:j===0?140:j===1?160:80 }} /></td>)}
                </tr>
              )) : users.length===0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', padding:'60px 20px' }}>
                  <Users size={32} color="var(--text-3)" style={{ margin:'0 auto 10px' }} />
                  <p style={{ fontSize:14, fontWeight:500, color:'var(--text-2)' }}>No users found</p>
                </td></tr>
              ) : users.map(u=>(
                <tr key={u.id} className="table-row" style={{ borderBottom:`1px solid var(--border)` }}>
                  <td style={{ padding:'13px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:'#0f0f0f', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 20px', color:'var(--text-2)' }}>{u.email}</td>
                  <td style={{ padding:'13px 20px' }}><span className={`badge ${RB[u.role]}`}>{RL[u.role]}</span></td>
                  <td style={{ padding:'13px 20px' }}><span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding:'13px 20px', fontSize:12, color:'var(--text-3)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding:'13px 20px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={()=>handleToggle(u)} className="btn btn-ghost btn-icon" title={u.is_active?'Deactivate':'Activate'}>
                        {u.is_active ? <ToggleRight size={17} color="#16a34a" /> : <ToggleLeft size={17} color="var(--text-3)" />}
                      </button>
                      <button onClick={()=>setModal(u)} className="btn btn-ghost btn-icon"><Pencil size={15}/></button>
                      <button onClick={()=>handleDelete(u.id)} className="btn btn-icon" style={{ background:'transparent', color:'#ef4444', border:'none', cursor:'pointer', padding:7, borderRadius:8 }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalPages>1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:`1px solid var(--border)` }}>
            <p style={{ fontSize:12, color:'var(--text-3)' }}>Page {page} of {totalPages}</p>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setPage(p=>p-1)} disabled={page===1} className="btn btn-secondary btn-sm">← Prev</button>
              <button onClick={()=>setPage(p=>p+1)} disabled={page===totalPages} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
