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