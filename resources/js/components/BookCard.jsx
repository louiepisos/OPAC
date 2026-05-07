import React from 'react';

const FORMAT_ICON = { Print: 'ðŸ“–', Ebook: 'ðŸ’»', Audio: 'ðŸŽ§' };

export default function BookCard({ book, onClick }) {
  const available = book.available_copies_count ?? 0;
  const authors   = book.authors?.map(a => a.name).join(', ') || 'Unknown Author';

  return (
    <button onClick={onClick} style={S.card}>
      <div style={S.spine} />
      <div style={S.body}>
        <div style={S.format}>{FORMAT_ICON[book.format] ?? 'ðŸ“–'} {book.format}</div>
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
          {available > 0 ? `âœ“ ${available} available` : 'âœ— Not available'}
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