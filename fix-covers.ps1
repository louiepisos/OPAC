# fix-covers.ps1
# Adds real book cover images from Open Library API (free, uses ISBN)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Write-File($path, $content) {
    $fullPath = Join-Path (Get-Location) $path
    [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
    Write-Host "  Fixed: $path" -ForegroundColor Green
}

Write-Host "Adding book cover images..." -ForegroundColor Cyan

# ── BookCard.jsx — shows cover in the card grid ──────────────
Write-File "resources\js\components\BookCard.jsx" @'
import React, { useState } from 'react';

function BookCover({ isbn, title, format }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = isbn && !imgError
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
    : null;

  const formatColors = { Print: '#c9922d', Ebook: '#4a90c4', Audio: '#5aad7f' };
  const color = formatColors[format] ?? '#8a7f72';

  if (coverUrl) {
    return (
      <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#f0ebe0' }}>
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // Fallback — no ISBN or image failed to load
  return (
    <div style={{
      width: '100%', height: 180,
      background: `linear-gradient(160deg, ${color}22, ${color}44)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      borderBottom: `3px solid ${color}`,
      padding: '1rem',
    }}>
      <div style={{
        width: 48, height: 64, background: color + '33',
        border: `2px solid ${color}66`, borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '.5rem',
      }}>
        <div style={{ width: 24, height: 3, background: color, borderRadius: 2, boxShadow: `0 6px 0 ${color}, 0 12px 0 ${color}` }} />
      </div>
      <span style={{ fontSize: '.7rem', color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {format ?? 'Book'}
      </span>
    </div>
  );
}

export default function BookCard({ book, onClick }) {
  const available = book.available_copies_count ?? 0;
  const authors   = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';

  return (
    <button onClick={onClick} style={S.card}>
      <BookCover isbn={book.isbn} title={book.title} format={book.format} />
      <div style={S.body}>
        <div style={S.format}>{book.format}</div>
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
          {available > 0 ? `${available} available` : 'Not available'}
        </div>
      </div>
    </button>
  );
}

const S = {
  card:     { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e0d0', boxShadow: '0 2px 12px rgba(26,20,16,.07)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column' },
  body:     { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.3rem' },
  format:   { fontSize: '.73rem', color: '#8a7f72', textTransform: 'uppercase', letterSpacing: '.06em' },
  title:    { fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3, color: '#1a1410' },
  subtitle: { fontSize: '.8rem', color: '#6a5f52', fontStyle: 'italic', lineHeight: 1.3 },
  author:   { fontSize: '.84rem', color: '#5a4f42', marginTop: 'auto' },
  meta:     { display: 'flex', gap: '.5rem', fontSize: '.73rem', color: '#8a7f72', flexWrap: 'wrap' },
  badge:    { fontSize: '.73rem', fontWeight: 600, padding: '.25rem .6rem', borderRadius: 20, marginTop: '.5rem', display: 'inline-block' },
};
'@

# ── BookDetailPage.jsx — shows large cover on detail view ────
Write-File "resources\js\pages\BookDetailPage.jsx" @'
import React, { useState, useEffect } from 'react';
import Spinner from '../components/Spinner';

function LargeCover({ isbn, title, format }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = isbn && !imgError
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
    : null;

  const formatColors = { Print: '#c9922d', Ebook: '#4a90c4', Audio: '#5aad7f' };
  const color = formatColors[format] ?? '#8a7f72';

  if (coverUrl) {
    return (
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '4px 4px 24px rgba(0,0,0,.25)',
        background: '#f0ebe0', minHeight: 340,
      }}>
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImgError(true)}
          style={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Fallback cover
  return (
    <div style={{
      background: `linear-gradient(160deg, #2c1810, #5a3520)`,
      borderRadius: 12, padding: '2rem 1.25rem', color: '#f8f4ec',
      minHeight: 340, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', position: 'relative', overflow: 'hidden',
      boxShadow: '4px 4px 20px rgba(0,0,0,.3)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg,${color},#e8c97a,${color})` }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        width: 80, height: 100,
        background: 'rgba(255,255,255,.08)',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,.3)', borderRadius: 2, boxShadow: '0 10px 0 rgba(255,255,255,.3), 0 20px 0 rgba(255,255,255,.3)' }} />
      </div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '.5rem' }}>{title}</div>
    </div>
  );
}

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
        <LargeCover isbn={book.isbn} title={book.title} format={book.format} />
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
                    {c.status}
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
  grid:        { display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'start' },
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

Write-Host ""
Write-Host "Done! Vite will auto-reload." -ForegroundColor Green
Write-Host "Refresh http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Books with ISBNs will show real covers automatically." -ForegroundColor Yellow
Write-Host "Books without ISBNs will show a styled placeholder." -ForegroundColor Yellow
