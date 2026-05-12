import React, { useEffect, useState } from 'react';
import { booksApi, statsApi } from '../../lib/api';

export default function AdminHome({ setPage }) {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi.get().then(setStats).catch((e) => setError(e.message || 'Unable to load admin stats.'));
    booksApi.list({ per_page: 6 }).then((r) => setBooks(r.data || [])).catch((e) => setError(e.message || 'Unable to load books.'));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = { per_page: 6 };
      if (search.trim()) params.q = search.trim();
      booksApi.list(params).then((r) => setBooks(r.data || [])).catch((e) => setError(e.message || 'Unable to search books.'));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const quick = [
    { icon: 'BK', label: 'Manage books', page: 'books', subtitle: stats ? `${stats.total_books ?? 0} books` : 'Loading...' },
    { icon: 'AU', label: 'Authors', page: 'authors', subtitle: stats ? `${stats.total_authors ?? 0} authors` : 'Loading...' },
    { icon: 'ST', label: 'Students', page: 'students', subtitle: stats ? `${stats.total_users ?? 0} users` : 'Loading...' },
    { icon: 'PH', label: 'Print History', page: 'prints', subtitle: stats ? `${stats.print_slips ?? 0} slips` : 'Loading...' },
    { icon: 'DB', label: 'Dashboard', page: 'dashboard', subtitle: stats ? `${stats.available_copies ?? 0} available` : 'Loading...' },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#0f2744 0%,#1a4a7a 60%,#1a7a4a 100%)', borderRadius: 12, padding: '22px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Welcome, Librarian!</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.68)' }}>Manage books, authors, students, and print slips.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,.92)', fontFamily: 'monospace' }}>{timeStr}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
        {quick.map((q) => (
          <button key={q.label} onClick={() => setPage(q.page)} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 10px',
            cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 13, margin: '0 auto 8px', width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{q.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{q.label}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{q.subtitle}</div>
          </button>
        ))}
      </div>

      {error && <div style={S.error}>{error}</div>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
          {[
            { label: 'Total Books', val: stats.total_books, grad: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
            { label: 'Available', val: stats.available_copies, grad: 'linear-gradient(90deg,#1a7a4a,#2ecc8a)' },
            { label: 'Printed Copies', val: stats.borrowed_copies, grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            { label: 'Authors', val: stats.total_authors, grad: 'linear-gradient(90deg,#e03e3e,#f87171)' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.grad }} />
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1a202c', lineHeight: 1 }}>{s.val ?? '-'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.searchPanel}>
        <div style={S.searchHeader}>
          <div>
            <div style={S.panelTitle}>Search books</div>
            <div style={S.panelSubtle}>Quickly find books from the admin home and jump to Manage Books for edits or printing.</div>
          </div>
          <button onClick={() => setPage('books')} style={S.linkButton}>Open Manage Books</button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, ISBN, subject, or publisher..."
          style={S.searchInput}
        />
        <div style={S.bookGrid}>
          {books.map((book) => (
            <button key={book.book_id} onClick={() => { setPage('books'); }} style={S.bookCard} className="opac-hover-lift">
              <div style={S.bookTitle}>{book.title}</div>
              <div style={S.bookMeta}>{(book.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
              <div style={S.pillRow}>
                <span style={S.pill}>{book.available_copies_count ?? 0} available</span>
                <span style={S.pill}>{book.borrowed_copies_count ?? 0} printed</span>
              </div>
            </button>
          ))}
          {books.length === 0 && <div style={S.empty}>No matching books found.</div>}
        </div>
      </div>
    </div>
  );
}

const S = {
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 8, padding: '9px 10px', fontSize: 12, marginBottom: 12 },
  searchPanel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 12px 35px rgba(15,39,68,.06)' },
  searchHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  panelTitle: { fontSize: 14, fontWeight: 800, color: '#1a202c' },
  panelSubtle: { fontSize: 11, color: '#64748b' },
  linkButton: { fontSize: 11, fontWeight: 800, border: '1px solid #cbd5e1', background: '#fff', color: '#0f2744', borderRadius: 8, padding: '8px 10px' },
  searchInput: { width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', marginBottom: 12 },
  bookGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 },
  bookCard: { textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, minHeight: 104, fontFamily: 'inherit', transition: 'transform .18s ease, box-shadow .18s ease, background .18s ease' },
  bookTitle: { fontSize: 12, fontWeight: 800, color: '#0f2744', lineHeight: 1.35, marginBottom: 4 },
  bookMeta: { fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pillRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 },
  pill: { fontSize: 10, fontWeight: 800, color: '#1f2937', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 99, padding: '3px 7px' },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: 24, fontSize: 12 },
};
