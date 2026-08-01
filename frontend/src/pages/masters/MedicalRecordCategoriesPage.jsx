import { useEffect, useState, useMemo } from 'react';
import { Layers, ChevronRight, ChevronDown, Search, Loader2, Inbox, RefreshCw, FolderOpen, Tags as TypesIcon } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

/**
 * Medical Record Categories — READ-ONLY, sourced from
 * GET /api/medical-record-categories, which returns categories with
 * nested subCategories[], each carrying its own nested types[].
 *
 * Because this shape is hierarchical (not a flat row-per-record
 * table like the other Master Data screens), it's rendered as an
 * expandable tree instead of reusing the generic PublicDataTable.
 */
export default function MedicalRecordCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState(new Set());
  const [openSubs, setOpenSubs] = useState(new Set());

  const load = () => {
    setLoading(true);
    api.get('/medical-record-categories')
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch((e) => toast.error(e.response?.data?.error || 'Failed to load medical record categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => {
      if (cat.name?.toLowerCase().includes(q)) return true;
      return (cat.subCategories || []).some((sc) =>
        sc.name?.toLowerCase().includes(q) || (sc.types || []).some((t) => t.name?.toLowerCase().includes(q))
      );
    });
  }, [categories, search]);

  const toggleCat = (id) => setOpenCats((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSub = (id) => setOpenSubs((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalSubs = categories.reduce((n, c) => n + (c.subCategories?.length || 0), 0);
  const totalTypes = categories.reduce((n, c) => n + (c.subCategories || []).reduce((m, sc) => m + (sc.types?.length || 0), 0), 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Medical Record Categories</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {categories.length} categories · {totalSubs} sub-categories · {totalTypes} record types — sourced from GET /api/medical-record-categories
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary" disabled={loading}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />} Refresh
        </button>
      </div>

      <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '14px 16px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search categories, sub-categories or types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Layers size={32} color="var(--text-3)" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>No categories found</p>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Try adjusting your search</p>
          </div>
        ) : (
          <div>
            {filtered.map((cat) => {
              const isOpen = openCats.has(cat.id);
              const subs = cat.subCategories || [];
              return (
                <div key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="table-row"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {isOpen ? <ChevronDown size={15} color="var(--text-3)" /> : <ChevronRight size={15} color="var(--text-3)" />}
                    <Layers size={16} color="var(--accent)" />
                    <span style={{ fontWeight: 600, fontSize: 13.5, flex: 1 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{subs.length} sub-categor{subs.length === 1 ? 'y' : 'ies'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-4)', minWidth: 150, textAlign: 'right' }}>Created {fmt(cat.created_at)}</span>
                  </button>

                  {isOpen && (
                    <div style={{ background: 'var(--bg)', padding: '4px 20px 12px 46px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {subs.length === 0 ? (
                        <p style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '8px 0' }}>No sub-categories.</p>
                      ) : subs.map((sc) => {
                        const subOpen = openSubs.has(sc.id);
                        const types = sc.types || [];
                        return (
                          <div key={sc.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <button
                              onClick={() => toggleSub(sc.id)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                            >
                              {subOpen ? <ChevronDown size={14} color="var(--text-3)" /> : <ChevronRight size={14} color="var(--text-3)" />}
                              <FolderOpen size={14} color="var(--text-3)" />
                              <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{sc.name}</span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{types.length} type{types.length === 1 ? '' : 's'}</span>
                              <span style={{ fontSize: 11.5, color: 'var(--text-4)', minWidth: 140, textAlign: 'right' }}>Updated {fmt(sc.updated_at)}</span>
                            </button>
                            {subOpen && (
                              <div style={{ borderTop: '1px solid var(--border)' }}>
                                {types.length === 0 ? (
                                  <p style={{ fontSize: 12, color: 'var(--text-3)', padding: '10px 14px' }}>No record types.</p>
                                ) : (
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                    <thead>
                                      <tr style={{ background: 'var(--bg-subtle)' }}>
                                        {['Type', 'Unit', 'Created At', 'Updated At'].map((h) => (
                                          <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {types.map((t) => (
                                        <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                                          <td style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 6 }}><TypesIcon size={12} color="var(--text-3)" />{t.name}</td>
                                          <td style={{ padding: '9px 14px', color: 'var(--text-3)' }}>{t.unit || '—'}</td>
                                          <td style={{ padding: '9px 14px', color: 'var(--text-3)' }}>{fmt(t.created_at)}</td>
                                          <td style={{ padding: '9px 14px', color: 'var(--text-3)' }}>{fmt(t.updated_at)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
