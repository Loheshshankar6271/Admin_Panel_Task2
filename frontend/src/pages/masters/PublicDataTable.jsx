import { useEffect, useState, useMemo } from 'react';
import { Search, Loader2, Inbox, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

/**
 * Generic READ-ONLY master data table.
 *
 * Every "Master Data" screen now sources its data directly from the
 * public, unauthenticated Task 2 Extension API (GET /api/<endpoint>)
 * instead of the old authenticated /api/masters/* admin CRUD routes.
 * Those public endpoints are read-only (GET only, no add/edit/delete),
 * so this component only lists data — search and pagination happen
 * client-side since the public API returns a plain array with no
 * server-side query params.
 *
 * Reused by every Master Data screen — each one just supplies its own
 * endpoint, columns and labels.
 */
export default function PublicDataTable({
  endpoint,
  icon: Icon,
  titleSingular,
  titlePlural,
  description,
  searchPlaceholder,
  columns,
  searchKeys,
  rowKey = 'id',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const load = () => {
    setLoading(true);
    api.get(endpoint)
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((e) => toast.error(e.response?.data?.error || `Failed to load ${titlePlural.toLowerCase()}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [endpoint]);
  useEffect(() => { setPage(1); }, [search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    const keys = searchKeys && searchKeys.length ? searchKeys : columns.map((c) => c.key);
    return items.filter((item) =>
      keys.some((k) => String(item?.[k] ?? '').toLowerCase().includes(q))
    );
  }, [items, search, searchKeys, columns]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>{titlePlural}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
            {description || `${total} total ${titlePlural.toLowerCase()}`}
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
            placeholder={searchPlaceholder || `Search ${titlePlural.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {columns.map((c) => (
                  <th key={c.key} style={{ textAlign: 'left', padding: '11px 20px', fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {columns.map((c, j) => (
                    <td key={c.key} style={{ padding: '14px 20px' }}>
                      <div className="skeleton" style={{ height: 14, borderRadius: 4, width: j === 0 ? 140 : 90 }} />
                    </td>
                  ))}
                </tr>
              )) : paged.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '60px 20px' }}>
                  {Icon ? <Icon size={32} color="var(--text-3)" style={{ margin: '0 auto 10px' }} /> : <Inbox size={32} color="var(--text-3)" style={{ margin: '0 auto 10px' }} />}
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)' }}>No {titlePlural.toLowerCase()} found</p>
                  <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Try adjusting your search</p>
                </td></tr>
              ) : paged.map((item) => (
                <tr key={item[rowKey]} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: '13px 20px', color: 'var(--text-2)' }}>
                      {c.render ? c.render(item) : (item[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="btn btn-secondary btn-sm">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="btn btn-secondary btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
