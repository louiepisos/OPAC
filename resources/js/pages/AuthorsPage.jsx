import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';

export default function AuthorsPage() {
  const [authors, setAuthors] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ per_page: 50 });
    if (search) p.set('q', search);
    fetch('/api/v1/authors?' + p)
      .then((r) => r.json())
      .then(setAuthors)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <h2 style={S.pageTitle}>Authors</h2>
      <input
        style={S.input}
        placeholder="Search authors..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <Spinner />}
      {!loading && (
        <div style={S.grid}>
          {authors?.data?.map((author) => (
            <div key={author.author_id} style={S.card}>
              <div style={S.avatar}>{author.name.charAt(0).toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={S.name}>{author.name}</div>
                <div style={S.meta}>
                  {author.author_type}
                  {author.birth_date ? ` - b. ${String(author.birth_date).slice(0, 4)}` : ''}
                  {author.death_date ? ` - d. ${String(author.death_date).slice(0, 4)}` : ''}
                </div>
                <div style={S.count}>{author.books_count ?? 0} book(s)</div>
                {author.bio && <div style={S.bio}>{author.bio}</div>}
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
  input: { width: '100%', maxWidth: 400, padding: '.7rem 1rem', borderRadius: 10, border: '1.5px solid #ddd6c8', background: '#fff', fontSize: '.95rem', outline: 'none', marginBottom: '1.5rem', display: 'block' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' },
  card: { background: '#fff', border: '1px solid #e8e0d0', borderRadius: 8, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(26,20,16,.06)' },
  avatar: { width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#c9922d,#e8c97a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontWeight: 700, fontSize: '1.3rem', flexShrink: 0 },
  name: { fontWeight: 700, fontSize: '.95rem' },
  meta: { fontSize: '.78rem', color: '#8a7f72' },
  count: { fontSize: '.78rem', color: '#c9922d', fontWeight: 700, marginTop: '.2rem' },
  bio: { fontSize: '.76rem', color: '#6a5f52', marginTop: '.35rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
};
