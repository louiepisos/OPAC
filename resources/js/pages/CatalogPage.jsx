import React, { useState, useEffect } from 'react';
import BookCard   from '../components/BookCard';
import Spinner    from '../components/Spinner';
import Pagination from '../components/Pagination';

export default function CatalogPage({ onSelectBook }) {
  const [books,   setBooks]   = useState(null);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [format,  setFormat]  = useState('');
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    fetch('/api/v1/stats').then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, per_page: 12 });
    if (search) p.set('q', search);
    if (format) p.set('format', format);
    fetch('/api/v1/books?' + p)
      .then(r => r.json()).then(setBooks).catch(() => setBooks(null))
      .finally(() => setLoading(false));
  }, [search, format, page]);

  return (
    <div>
      {stats && (
        <div style={S.statsBar}>
          {[['Total Books', stats.total_books], ['Authors', stats.total_authors], ['Copies', stats.total_copies], ['Available', stats.available_copies]].map(([label, val]) => (
            <div key={label} style={S.statCard}>
              <div style={S.statVal}>{val?.toLocaleString() ?? '—'}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={S.filterBar}>
        <input
          style={S.input}
          placeholder="Search titles, authors, ISBN, subjectsâ€¦"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={S.select} value={format} onChange={e => { setFormat(e.target.value); setPage(1); }}>
          <option value="">All Formats</option>
          <option value="Print">Print</option>
          <option value="Ebook">Ebook</option>
          <option value="Audio">Audio</option>
        </select>
      </div>
      {loading && <Spinner />}
      {!loading && books && (
        <>
          <p style={{ color: '#8a7f72', fontSize: '.85rem', marginBottom: '1rem' }}>
            {books.total} result{books.total !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''}
          </p>
          <div style={S.grid}>
            {books.data.map(b => <BookCard key={b.book_id} book={b} onClick={() => onSelectBook(b)} />)}
          </div>
          {books.data.length === 0 && <div style={S.empty}><p>No books found.</p></div>}
          {books.last_page > 1 && <Pagination current={page} last={books.last_page} onPage={setPage} />}
        </>
      )}
    </div>
  );
}

const S = {
  statsBar:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard:  { background: '#fff', borderRadius: 12, padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(26,20,16,.07)', border: '1px solid #e8e0d0' },
  statVal:   { fontSize: '2rem', fontWeight: 700, fontFamily: 'Georgia,serif', color: '#c9922d' },
  statLabel: { fontSize: '.75rem', color: '#8a7f72', marginTop: '.25rem', textTransform: 'uppercase', letterSpacing: '.08em' },
  filterBar: { display: 'flex', gap: '.75rem', marginBottom: '1.25rem' },
  input:     { flex: 1, padding: '.7rem 1rem', borderRadius: 10, border: '1.5px solid #ddd6c8', background: '#fff', fontSize: '.95rem', outline: 'none' },
  select:    { padding: '.7rem .9rem', borderRadius: 10, border: '1.5px solid #ddd6c8', background: '#fff', fontSize: '.9rem', cursor: 'pointer', outline: 'none' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem' },
  empty:     { textAlign: 'center', padding: '5rem 2rem', color: '#8a7f72' },
};