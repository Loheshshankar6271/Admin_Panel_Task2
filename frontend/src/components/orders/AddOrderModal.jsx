import { useState } from 'react';
import { X, Loader2, ShoppingCart } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AddOrderModal({ onClose, onSave }) {
  const [form, setForm] = useState({ customer_name:'', customer_email:'', total_amount:'', notes:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.customer_name || !form.total_amount) { toast.error('Customer name and amount are required'); return; }
    setSaving(true);
    try {
      await api.post('/orders', form);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:`1px solid var(--border)` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ShoppingCart size={16} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700 }}>New Order</h3>
              <p style={{ fontSize:12, color:'var(--text-3)' }}>Fill in the order details</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Customer Name *</label>
            <input className="input" placeholder="e.g. Ravi Kumar" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Customer Email</label>
            <input type="email" className="input" placeholder="customer@example.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Amount (₹) *</label>
            <input type="number" className="input" placeholder="0.00" min="0" step="0.01" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:12.5, fontWeight:600, marginBottom:6 }}>Notes</label>
            <textarea className="input" placeholder="Any additional notes..." rows={3} style={{ resize:'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', gap:8, padding:'16px 24px', borderTop:`1px solid var(--border)` }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex:1, justifyContent:'center' }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Placing...' : 'Place Order'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
