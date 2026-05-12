import React, { useState } from 'react';

function BookCover({ isbn, title, format, coverImage }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = !imgError
    ? (coverImage || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : null))
    : null;

  const formatColors = { Print: '#c9922d', Ebook: '#4a90c4', Audio: '#5aad7f' };
  const color = formatColors[format] ?? '#8a7f72';

  if (coverUrl) {
    return (
      <div style={{ width: '100%', height: 180, overflow: 'hidden', background: '#f0ebe0', padding: 8 }}>
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    );
  }

  // Fallback â€” no ISBN or image failed to load
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
      <BookCover isbn={book.isbn} title={book.title} format={book.format} coverImage={book.cover_image_url} />
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
