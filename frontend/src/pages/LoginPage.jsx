import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLE_HOME = { super_admin:'/dashboard/admin', manager:'/dashboard/manager', staff:'/dashboard/staff' };
const DEMOS = [
  { role:'Super Admin', email:'admin@example.com',   password:'Admin@123', color:'#6B2DAB', bg:'#F5EDFD', dot:'#6B2DAB' },
  { role:'Manager',     email:'manager@example.com', password:'Admin@123', color:'#1A4EBD', bg:'#EEF3FD', dot:'#1A4EBD' },
  { role:'Staff',       email:'staff@example.com',   password:'Admin@123', color:'#1A6A2A', bg:'#EDF7ED', dot:'#1A6A2A' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={ROLE_HOME[user.role]||'/dashboard/staff'} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(ROLE_HOME[u.role]||'/dashboard/staff');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }} className="animate-slide-up">

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:52, height:52,
            background:'linear-gradient(135deg,#1A1714 0%,#2D2926 100%)',
            borderRadius:16,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px',
            boxShadow:'0 4px 20px rgba(26,23,20,0.2)',
            animation:'float 3s ease-in-out infinite'
          }}>
            <Zap size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.6px', color:'var(--text-1)' }}>Welcome back</h1>
          <p style={{ fontSize:14, color:'var(--text-3)', marginTop:6 }}>Sign in to your workspace</p>
        </div>

        {/* Form card */}
        <div className="login-card">
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6, color:'var(--text-2)' }}>
                Email address
              </label>
              <input
                type="email" className="input"
                placeholder="you@example.com"
                value={email} onChange={e=>setEmail(e.target.value)}
                required autoFocus
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6, color:'var(--text-2)' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPass?'text':'password'} className="input"
                  style={{ paddingRight:42 }}
                  placeholder="••••••••"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  required
                />
                <button
                  type="button" onClick={()=>setShowPass(!showPass)}
                  style={{
                    position:'absolute', right:11, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer',
                    color:'var(--text-4)', display:'flex', alignItems:'center',
                    transition:'color 0.15s ease'
                  }}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--text-2)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-4)'}
                >
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ justifyContent:'center', padding:'11px 16px', marginTop:4, fontSize:14 }}
            >
              {loading
                ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Signing in...</>
                : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div>
          <p style={{ textAlign:'center', fontSize:12, color:'var(--text-4)', marginBottom:10 }}>
            Demo accounts — click to autofill
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {DEMOS.map(acc=>(
              <button
                key={acc.role}
                onClick={()=>{ setEmail(acc.email); setPassword(acc.password); }}
                className="login-demo-btn"
              >
                <div style={{
                  width:28, height:28, borderRadius:8, background:acc.bg,
                  margin:'0 auto 8px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:`1px solid ${acc.color}22`
                }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:acc.dot }} />
                </div>
                <p style={{ fontSize:11.5, fontWeight:700, color:acc.color }}>{acc.role}</p>
                <p style={{ fontSize:11, color:'var(--text-4)', marginTop:2 }}>{acc.email.split('@')[0]}</p>
              </button>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:12, color:'var(--text-4)', marginTop:12 }}>
            Password:{' '}
            <code style={{
              background:'var(--claude-warm)', padding:'2px 8px',
              borderRadius:5, fontFamily:'monospace', fontSize:12,
              color:'var(--text-2)', border:'1px solid var(--border)'
            }}>Admin@123</code>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
