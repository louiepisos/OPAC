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
                    {c.status === 'Available' ? 'âœ“' : 'âœ—'} {c.status}
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