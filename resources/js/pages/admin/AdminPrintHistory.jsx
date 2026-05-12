import React, { useEffect, useState } from 'react';
import { printSlipsApi } from '../../lib/api';

export default function AdminPrintHistory() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function load(p = page) {
    setLoading(true);
    setError('');
    const params = { page: p, per_page: 12 };
    if (search.trim()) params.q = search.trim();

    printSlipsApi.list(params)
      .then((r) => {
        setItems(r.data || []);
        setMeta(r);
        setPage(p);
      })
      .catch((e) => {
        setItems([]);
        setError(e.message || 'Unable to load print slip history.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(1); }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(1), 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="opac-fade-in">
      <div style={S.toolbar}>
        <div>
          <div style={S.title}>Print slip history ({meta.total || 0})</div>
          <div style={S.subtle}>Review every printed reference slip and reopen slips for printing.</div>
        </div>
        <a href={items[0] ? `/print-slips/${items[0].print_transaction_id}` : '#'} target="_blank" rel="noreferrer" style={{ ...S.primaryButton, opacity: items[0] ? 1 : 0.45, pointerEvents: items[0] ? 'auto' : 'none', textDecoration: 'none' }}>
          Open latest
        </a>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search slip number, book, requester, email, or copy barcode..."
        style={{ ...S.input, marginBottom: 14 }}
      />

      <div style={S.panel}>
        <div style={S.headerRow}>
          <span>Slip</span>
          <span>Book</span>
          <span>Requester</span>
          <span>Printed</span>
          <span />
        </div>

        {loading && <div style={S.empty}>Loading print slip history...</div>}
        {!loading && items.length === 0 && <div style={S.empty}>No printed slips found.</div>}

        {!loading && items.map((item) => (
          <div key={item.print_transaction_id} style={S.row} className="opac-hover-lift">
            <div style={S.slipCell}>
              <div style={S.strong}>{item.slip_number}</div>
              <div style={S.subtle}>{item.copy?.barcode || `Copy #${item.copy_id || '-'}`}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={S.bookTitle}>{item.book?.title || 'Untitled book'}</div>
              <div style={S.subtle}>{(item.book?.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={S.strong}>{item.requester_name || item.user?.name || 'Walk-in request'}</div>
              <div style={S.subtle}>{item.requester_email || item.user?.email || 'No email'}</div>
            </div>
            <div style={S.dateCell}>{formatDate(item.printed_at || item.created_at)}</div>
            <a href={`/print-slips/${item.print_transaction_id}`} target="_blank" rel="noreferrer" style={S.link}>Open / Print</a>
          </div>
        ))}
      </div>

      {meta.last_page > 1 && (
        <div style={S.pagination}>
          <span style={S.subtle}>Page {page} of {meta.last_page}</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => load(p)} style={{ ...S.pageButton, ...(p === page ? S.pageActive : {}) }}>{p}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

const S = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: 700, color: '#1a202c' },
  subtle: { fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', color: '#1a202c', outline: 'none', background: '#fff', transition: 'border-color .2s ease, box-shadow .2s ease' },
  primaryButton: { fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#1a7a4a', color: '#fff', fontFamily: 'inherit' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 35px rgba(15,39,68,.06)' },
  headerRow: { display: 'grid', gridTemplateColumns: '1.1fr 1.5fr 1.25fr .9fr 90px', gap: 12, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' },
  row: { display: 'grid', gridTemplateColumns: '1.1fr 1.5fr 1.25fr .9fr 90px', gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #eef2f7', transition: 'transform .18s ease, background .18s ease, box-shadow .18s ease' },
  slipCell: { minWidth: 0 },
  strong: { fontSize: 12, fontWeight: 700, color: '#1a202c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  bookTitle: { fontSize: 12, fontWeight: 800, color: '#0f2744', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dateCell: { fontSize: 11, color: '#475569' },
  link: { fontSize: 11, fontWeight: 800, color: '#1d4ed8', textDecoration: 'none' },
  empty: { textAlign: 'center', color: '#64748b', padding: 36, fontSize: 12 },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '9px 10px', fontSize: 12, marginBottom: 12 },
  pageButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 11, fontFamily: 'inherit' },
  pageActive: { background: '#0f2744', color: '#fff' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0' },
};
