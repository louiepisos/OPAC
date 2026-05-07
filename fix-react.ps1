# fix-react.ps1
# Rewrites all React files without BOM
# Run: powershell -ExecutionPolicy Bypass -File fix-react.ps1

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Write-File($path, $content) {
    $fullPath = Join-Path (Get-Location) $path
    New-Item -ItemType Directory -Force -Path (Split-Path $fullPath) | Out-Null
    [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
    Write-Host "  Fixed: $path" -ForegroundColor Green
}

Write-Host "Rewriting React files without BOM..." -ForegroundColor Cyan

# ── app.jsx ──────────────────────────────────────────────────
Write-File "resources\js\app.jsx" @'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './app.css';

const el = document.getElementById('app');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
'@

# ── App.jsx ──────────────────────────────────────────────────
Write-File "resources\js\App.jsx" @'
import React, { useState } from 'react';
import CatalogPage    from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import AuthorsPage    from './pages/AuthorsPage';
import SubjectsPage   from './pages/SubjectsPage';
import Header         from './components/Header';

export default function App() {
  const [view, setView]     = useState('catalog');
  const [selected, setBook] = useState(null);

  function openBook(book) { setBook(book); setView('book'); }
  function goBack()        { setView('catalog'); setBook(null); }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4ec', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Header view={view} setView={setView} goBack={goBack} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {view === 'catalog'  && <CatalogPage    onSelectBook={openBook} />}
        {view === 'book'     && <BookDetailPage book={selected} onBack={goBack} />}
        {view === 'authors'  && <AuthorsPage />}
        {view === 'subjects' && <SubjectsPage   onSelectBook={openBook} />}
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '.8rem', color: '#8a7f72', borderTop: '1px solid #ddd6c8' }}>
        OPAC · Online Public Access Catalog · Laravel + React + PostgreSQL
      </footer>
    </div>
  );
}
'@

# ── components/Header.jsx ────────────────────────────────────
Write-File "resources\js\components\Header.jsx" @'
import React from 'react';

const S = {
  header:  { background: '#1a1410', color: '#f8f4ec', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,.3)' },
  inner:   { maxWidth: 1200, margin: '0 auto', padding: '.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand:   { display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#f8f4ec' },
  title:   { fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '1.25rem', color: '#e8c97a', letterSpacing: '.05em' },
  sub:     { fontSize: '.68rem', opacity: .6, letterSpacing: '.08em' },
  nav:     { display: 'flex', gap: '.25rem' },
  btn:     { padding: '.4rem .9rem', borderRadius: 8, color: '#d4c5a9', fontSize: '.88rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' },
  active:  { background: '#c9922d', color: '#fff' },
};

const NAV = [
  { id: 'catalog',  label: 'Catalog'  },
  { id: 'authors',  label: 'Authors'  },
  { id: 'subjects', label: 'Subjects' },
];

export default function Header({ view, setView, goBack }) {
  return (
    <header style={S.header}>
      <div style={S.inner}>
        <button style={S.brand} onClick={goBack}>
          <span style={{ fontSize: '1.8rem' }}>📖</span>
          <span>
            <div style={S.title}>OPAC</div>
            <div style={S.sub}>Online Public Access Catalog</div>
          </span>
        </button>
        <nav style={S.nav}>
          {NAV.map(n => (
            <button
              key={n.id}
              style={{ ...S.btn, ...(view === n.id ? S.active : {}) }}
              onClick={() => setView(n.id)}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
'@

# ── components/BookCard.jsx ──────────────────────────────────
Write-File "resources\js\components\BookCard.jsx" @'
import React from 'react';

const FORMAT_ICON = { Print: '📖', Ebook: '💻', Audio: '🎧' };

export default function BookCard({ book, onClick }) {
  const available = book.available_copies_count ?? 0;
  const authors   = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';

  return (
    <button onClick={onClick} style={S.card}>
      <div style={S.spine} />
      <div style={S.body}>
        <div style={S.format}>{FORMAT_ICON[book.format] ?? '📖'} {book.format}</div>
        <h3 style={S.title}>{book.title}</h3>
        {book.subtitle && <p style={S.subtitle}>{book.subtitle}</p>}
        <p style={S.author}>{authors}</p>
        <div style={S.meta}>
          {book.publication_year && <span>{book.publication_year}</span>}
          {book.isbn && <span>ISBN {book.isbn}</span>}
        </div>
        <div style={{
          ...S.badge,
          background: available > 0 ? '#e8f5e9' : '#fce4ec',
          color:      available > 0 ? '#2e7d32' : '#c62828',
        }}>
          {available > 0 ? `✓ ${available} available` : '✗ Not available'}
        </div>
      </div>
    </button>
  );
}

const S = {
  card:     { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e0d0', boxShadow: '0 2px 12px rgba(26,20,16,.07)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', minHeight: 240 },
  spine:    { height: 6, background: 'linear-gradient(90deg,#c9922d,#e8c97a,#c9922d)' },
  body:     { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.3rem' },
  format:   { fontSize: '.73rem', color: '#8a7f72', textTransform: 'uppercase', letterSpacing: '.06em' },
  title:    { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, color: '#1a1410' },
  subtitle: { fontSize: '.8rem', color: '#6a5f52', fontStyle: 'italic', lineHeight: 1.3 },
  author:   { fontSize: '.84rem', color: '#5a4f42', marginTop: 'auto' },
  meta:     { display: 'flex', gap: '.5rem', fontSize: '.73rem', color: '#8a7f72', flexWrap: 'wrap' },
  badge:    { fontSize: '.73rem', fontWeight: 600, padding: '.25rem .6rem', borderRadius: 20, marginTop: '.5rem', display: 'inline-block' },
};
'@

# ── components/Spinner.jsx ───────────────────────────────────
Write-File "resources\js\components\Spinner.jsx" @'
import React from 'react';

export default function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e8e0d0',
        borderTop: '3px solid #c9922d',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  );
}
'@

# ── components/Pagination.jsx ────────────────────────────────
Write-File "resources\js\components\Pagination.jsx" @'
import React from 'react';

export default function Pagination({ current, last, onPage }) {
  const pages   = Array.from({ length: last }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === last || Math.abs(p - current) <= 2);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '.4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
      {visible.map((p, i) => {
        const prev = visible[i - 1];
        return (
          <React.Fragment key={p}>
            {prev && p - prev > 1 && <span style={{ padding: '.4rem', color: '#8a7f72' }}>…</span>}
            <button
              onClick={() => onPage(p)}
              style={{
                padding: '.4rem .75rem', borderRadius: 8,
                border: '1px solid #ddd6c8',
                background: p === current ? '#c9922d' : '#fff',
                color:      p === current ? '#fff'    : '#1a1410',
                cursor: 'pointer', fontSize: '.88rem',
              }}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
'@

# ── pages/CatalogPage.jsx ────────────────────────────────────
Write-File "resources\js\pages\CatalogPage.jsx" @'
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
          placeholder="Search titles, authors, ISBN, subjects…"
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
'@

# ── pages/BookDetailPage.jsx ─────────────────────────────────
Write-File "resources\js\pages\BookDetailPage.jsx" @'
import React, { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';

export default function BookDetailPage({ book: initial, onBack }) {
  const [book,    setBook]    = useState(initial);
  const [loading, setLoading] = useState(!initial?.copies);

  useEffect(() => {
    if (!book?.book_id) return;
    setLoading(true);
    fetch(`/api/v1/books/${book.book_id}`)
      .then(r => r.json()).then(setBook).finally(() => setLoading(false));
  }, [book?.book_id]);

  if (loading) return <Spinner />;
  if (!book)   return <div style={{ textAlign: 'center', padding: '5rem', color: '#8a7f72' }}>Book not found.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <button onClick={onBack} style={S.back}>Back to Catalog</button>
      <div style={S.grid}>
        <div style={S.cover}>
          <div style={S.coverSpine} />
          <div style={S.coverTitle}>{book.title}</div>
          <div style={S.coverAuthor}>{book.authors?.[0]?.name ?? ''}</div>
        </div>
        <div>
          <span style={S.formatTag}>{book.format}</span>
          <h1 style={S.title}>{book.title}</h1>
          {book.subtitle && <p style={S.subtitle}>{book.subtitle}</p>}
          <p style={S.authors}>by {book.authors?.map(a => a.name).join(', ') || 'Unknown'}</p>
          {book.description && <p style={S.desc}>{book.description}</p>}
          <table style={S.table}>
            <tbody>
              {[['ISBN', book.isbn], ['Publisher', book.publisher?.name], ['Year', book.publication_year], ['Edition', book.edition], ['Language', book.language], ['Format', book.format]]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <tr key={k}>
                    <td style={S.metaKey}>{k}</td>
                    <td style={S.metaVal}>{v}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {book.subjects?.length > 0 && (
            <div style={S.tagRow}>
              {book.subjects.map(s => <span key={s.subject_id} style={S.tag}>{s.subject_name}</span>)}
            </div>
          )}
          <div style={S.copiesBox}>
            <h3 style={{ fontFamily: 'Georgia,serif', marginBottom: '1rem' }}>
              Library Copies ({book.copies?.length ?? 0})
            </h3>
            <div style={S.copiesGrid}>
              {book.copies?.map(c => (
                <div key={c.copy_id} style={S.copyCard}>
                  <div style={{ fontWeight: 600, color: c.status === 'Available' ? '#2e7d32' : '#b71c1c' }}>
                    {c.status === 'Available' ? '✓' : '✗'} {c.status}
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#6a5f52' }}>{c.location || 'No location'}</div>
                  <div style={{ fontSize: '.75rem', color: '#8a7f72' }}>Copy #{c.copy_id}</div>
                </div>
              ))}
              {!book.copies?.length && <p style={{ color: '#8a7f72' }}>No copies recorded.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  back:        { color: '#c9922d', fontWeight: 600, fontSize: '.9rem', marginBottom: '1.5rem', cursor: 'pointer', background: 'none', border: 'none', display: 'block' },
  grid:        { display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', alignItems: 'start' },
  cover:       { background: 'linear-gradient(160deg,#2c1810,#5a3520)', borderRadius: 12, padding: '2rem 1.25rem', color: '#f8f4ec', minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden', boxShadow: '4px 4px 20px rgba(0,0,0,.3)' },
  coverSpine:  { position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'linear-gradient(90deg,#c9922d,#e8c97a,#c9922d)' },
  coverTitle:  { fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '.5rem' },
  coverAuthor: { fontSize: '.82rem', opacity: .75, fontStyle: 'italic' },
  formatTag:   { fontSize: '.73rem', textTransform: 'uppercase', letterSpacing: '.1em', color: '#c9922d', fontWeight: 700 },
  title:       { fontFamily: 'Georgia,serif', fontSize: '1.9rem', fontWeight: 700, lineHeight: 1.2, marginTop: '.25rem' },
  subtitle:    { fontSize: '1.05rem', fontStyle: 'italic', color: '#6a5f52', marginTop: '.25rem' },
  authors:     { fontSize: '.95rem', color: '#5a4f42', marginTop: '.5rem' },
  desc:        { marginTop: '1.25rem', lineHeight: 1.75, color: '#3a3028', fontSize: '.93rem' },
  table:       { width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem', fontSize: '.88rem' },
  metaKey:     { padding: '.45rem 1rem .45rem 0', color: '#8a7f72', fontWeight: 600, textTransform: 'uppercase', fontSize: '.73rem', letterSpacing: '.06em', borderBottom: '1px solid #e8e0d0', width: 120 },
  metaVal:     { padding: '.45rem 0', borderBottom: '1px solid #e8e0d0' },
  tagRow:      { display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '1.25rem' },
  tag:         { background: '#fef3e2', color: '#92600a', border: '1px solid #e8c97a', borderRadius: 20, padding: '.28rem .7rem', fontSize: '.78rem', fontWeight: 500 },
  copiesBox:   { marginTop: '2rem', padding: '1.5rem', background: '#fdfaf4', border: '1px solid #e8e0d0', borderRadius: 12 },
  copiesGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '.75rem' },
  copyCard:    { background: '#fff', border: '1px solid #e8e0d0', borderRadius: 8, padding: '.85rem', display: 'flex', flexDirection: 'column', gap: '.3rem' },
};
'@

# ── pages/AuthorsPage.jsx ────────────────────────────────────
Write-File "resources\js\pages\AuthorsPage.jsx" @'
import React, { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState(null);
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ per_page: 50 });
    if (search) p.set('q', search);
    fetch('/api/v1/authors?' + p)
      .then(r => r.json()).then(setAuthors).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <h2 style={S.pageTitle}>Authors</h2>
      <input
        style={S.input}
        placeholder="Search authors..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading && <Spinner />}
      {!loading && (
        <div style={S.grid}>
          {authors?.data?.map(a => (
            <div key={a.author_id} style={S.card}>
              <div style={S.avatar}>{a.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={S.name}>{a.name}</div>
                <div style={S.meta}>{a.author_type}{a.birth_date ? ` · b. ${a.birth_date.slice(0,4)}` : ''}</div>
                <div style={S.count}>{a.books_count ?? 0} book(s)</div>
              </div>
            </div>
          ))}
          {authors?.data?.length === 0 && <p style={{ color: '#8a7f72' }}>No authors found.</p>}
        </div>
      )}
    </div>
  );
}

const S = {
  pageTitle: { fontFamily: 'Georgia,serif', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.25rem' },
  input:     { width: '100%', maxWidth: 400, padding: '.7rem 1rem', borderRadius: 10, border: '1.5px solid #ddd6c8', background: '#fff', fontSize: '.95rem', outline: 'none', marginBottom: '1.5rem', display: 'block' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' },
  card:      { background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 8px rgba(26,20,16,.06)' },
  avatar:    { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#c9922d,#e8c97a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 },
  name:      { fontWeight: 600, fontSize: '.95rem' },
  meta:      { fontSize: '.78rem', color: '#8a7f72' },
  count:     { fontSize: '.78rem', color: '#c9922d', fontWeight: 600, marginTop: '.2rem' },
};
'@

# ── pages/SubjectsPage.jsx ───────────────────────────────────
Write-File "resources\js\pages\SubjectsPage.jsx" @'
import React, { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import Spinner  from '../components/Spinner';

export default function SubjectsPage({ onSelectBook }) {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [books,    setBooks]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    fetch('/api/v1/subjects').then(r => r.json()).then(setSubjects).catch(() => {});
  }, []);

  function pickSubject(sub) {
    setSelected(sub);
    setLoading(true);
    fetch(`/api/v1/books?subject_id=${sub.subject_id}&per_page=50`)
      .then(r => r.json()).then(setBooks).finally(() => setLoading(false));
  }

  return (
    <div style={S.layout}>
      <aside style={S.aside}>
        <h3 style={S.asideTitle}>Browse by Subject</h3>
        {subjects.length === 0 && <p style={{ fontSize: '.82rem', color: '#8a7f72' }}>No subjects yet.</p>}
        {subjects.map(s => (
          <button
            key={s.subject_id}
            onClick={() => pickSubject(s)}
            style={{ ...S.subBtn, ...(selected?.subject_id === s.subject_id ? S.subBtnActive : {}) }}
          >
            {s.subject_name}
            <span style={S.count}>{s.books_count ?? 0}</span>
          </button>
        ))}
      </aside>
      <section style={{ flex: 1 }}>
        {!selected && <div style={S.empty}>Select a subject to browse books</div>}
        {selected && (
          <>
            <h2 style={S.pageTitle}>{selected.subject_name}</h2>
            {loading && <Spinner />}
            {!loading && books && (
              <div style={S.grid}>
                {books.data.map(b => <BookCard key={b.book_id} book={b} onClick={() => onSelectBook(b)} />)}
                {books.data.length === 0 && <p style={{ color: '#8a7f72' }}>No books in this subject.</p>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const S = {
  layout:      { display: 'flex', gap: '2rem', alignItems: 'flex-start' },
  aside:       { width: 220, flexShrink: 0, background: '#fff', border: '1px solid #e8e0d0', borderRadius: 12, padding: '1rem', boxShadow: '0 2px 8px rgba(26,20,16,.06)' },
  asideTitle:  { fontFamily: 'Georgia,serif', fontSize: '.93rem', fontWeight: 700, marginBottom: '.75rem', paddingBottom: '.5rem', borderBottom: '1px solid #e8e0d0' },
  subBtn:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '.48rem .6rem', borderRadius: 8, fontSize: '.84rem', color: '#3a3028', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left' },
  subBtnActive:{ background: '#fef3e2', color: '#92600a', fontWeight: 600 },
  count:       { background: '#f0ebe0', borderRadius: 20, padding: '.1rem .45rem', fontSize: '.73rem', color: '#8a7f72' },
  pageTitle:   { fontFamily: 'Georgia,serif', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.25rem' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1.25rem' },
  empty:       { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#8a7f72', fontSize: '1rem' },
};
'@

# ── app.css ──────────────────────────────────────────────────
Write-File "resources\css\app.css" @'
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #f8f4ec;
  color: #1a1410;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
button { cursor: pointer; font: inherit; }
input, select { font: inherit; }
@keyframes spin { to { transform: rotate(360deg); } }
'@

# ── Verify all first bytes ────────────────────────────────────
Write-Host ""
Write-Host "Verifying no BOM on key files..." -ForegroundColor Cyan
$checks = @(
    "resources\js\app.jsx",
    "resources\js\App.jsx",
    "resources\js\components\Header.jsx",
    "resources\js\pages\CatalogPage.jsx"
)
foreach ($f in $checks) {
    $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location) $f))
    $status = if ($bytes[0] -eq 0x69 -or $bytes[0] -eq 0x2F -or $bytes[0] -eq 0x3C) { "OK" } else { "CHECK" }
    Write-Host "  $status : $f (first byte: 0x$($bytes[0].ToString('X2')))" -ForegroundColor $(if ($status -eq "OK") { "Green" } else { "Yellow" })
}

Write-Host ""
Write-Host "Done! Now:" -ForegroundColor Green
Write-Host "  1. Save and close any open editors" -ForegroundColor White
Write-Host "  2. Vite will auto-reload" -ForegroundColor White
Write-Host "  3. Open http://localhost:8000" -ForegroundColor Cyan
