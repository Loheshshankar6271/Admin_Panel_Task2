import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
export default function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:18, background:'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <ShieldX size={28} color="#ef4444" />
      </div>
      <h2 style={{ fontSize:18, fontWeight:700 }}>Access Denied</h2>
      <p style={{ fontSize:13, color:'var(--text-2)', marginTop:8, maxWidth:300 }}>You don't have permission to view this page. Contact your administrator.</p>
      <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop:20 }}>Go Back</button>
    </div>
  );
}
