import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { authorsApi, booksApi, printSlipsApi, subjectsApi } from '../../lib/api';

export default function UserHome({ user }) {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCat, setCat] = useState('');
  const [detail, setDetail] = useState(null);
  const [label, setLabel] = useState('Most popular books');
  const [error, setError] = useState('');

  useEffect(() => {
    authorsApi.list({ per_page: 20 }).then((r) => setAuthors(r.data || [])).catch(() => {});
    subjectsApi.list().then(setSubjects).catch(() => {});
    booksApi.list({ per_page: 50 }).then((r) => setBooks(r.data || [])).catch(() => {});
  }, []);

  const filtered = books.filter((book) => {
    const text = [
      book.title,
      book.isbn,
      book.publisher?.name,
      ...(book.authors || []).map((a) => a.name),
      ...(book.subjects || []).map((s) => s.subject_name),
    ].join(' ').toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchCat = !activeCat || (book.subjects || []).some((s) => s.subject_name === activeCat);
    return matchSearch && matchCat;
  });

  function doSearch(q) {
    setSearch(q);
    setLabel(q ? `Results for "${q}"` : activeCat ? `${activeCat} books` : 'Most popular books');
  }

  function pickCat(cat) {
    setCat(cat);
    setLabel(cat ? `${cat} books` : 'Most popular books');
  }

  function updateBook(nextBook) {
    setBooks((prev) => prev.map((book) => (book.book_id === nextBook.book_id ? { ...book, ...nextBook } : book)));
    setDetail((prev) => (prev?.book_id === nextBook.book_id ? { ...prev, ...nextBook } : prev));
  }

  return (
    <div>
      <div style={S.hero}>
        <h1 style={S.heroTitle}>Find your next book</h1>
        <p style={S.heroCopy}>Search the library catalog and print a reference assistance slip.</p>
        <div style={S.searchBar}>
          <input
            value={search}
            onChange={(e) => doSearch(e.target.value)}
            placeholder="Search by title, author, subject, or ISBN..."
            style={S.searchInput}
          />
          <button style={S.searchButton}>Search</button>
        </div>
      </div>

      {error && <div style={{ ...S.error, margin: '14px 20px 0' }}>{error}</div>}

      {authors.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionLabel}>Browse by Author</div>
          <div style={S.authorRow}>
            {authors.map((author) => (
              <button key={author.author_id} onClick={() => doSearch(author.name)} style={S.authorButton}>
                <div style={S.avatar}>{initials(author.name)}</div>
                <div style={S.authorName}>{author.name.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {subjects.length > 0 && (
        <div style={{ ...S.section, borderTop: '1px solid #e2e8f0' }}>
          <div style={S.pills}>
            <button onClick={() => pickCat('')} style={{ ...S.pill, ...(!activeCat ? S.pillActive : {}) }}>All</button>
            {subjects.map((subject) => (
              <button
                key={subject.subject_id}
                onClick={() => pickCat(subject.subject_name)}
                style={{ ...S.pill, ...(activeCat === subject.subject_name ? S.pillActive : {}) }}
              >
                {subject.subject_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={S.booksSection}>
        <div style={S.sectionLabel}>{label}</div>
        <div style={S.grid}>
          {filtered.map((book) => (
            <div key={book.book_id} onClick={() => booksApi.get(book.book_id).then(setDetail).catch(() => setDetail(book))} style={S.card}>
              <BookCover book={book} height={94} />
              <div style={S.cardBody}>
                <div style={S.bookTitle}>{book.title}</div>
                <div style={S.bookAuthor}>{(book.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
                {shelfLocation(book) && <div style={S.shelfText}>Shelf: {shelfLocation(book)}</div>}
                <Availability book={book} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={S.empty}>No books found.</div>}
        </div>
      </div>

      {detail && (
        <BookDetailModal
          book={detail}
          user={user}
          onClose={() => setDetail(null)}
          onPrinted={updateBook}
          onError={setError}
        />
      )}
    </div>
  );
}

function BookDetailModal({ book, user, onClose, onPrinted, onError }) {
  const [printing, setPrinting] = useState(false);
  const available = book.available_copies_count ?? (book.copies?.filter((copy) => copy.status === 'Available').length ?? 0);

  async function printSlip() {
    setPrinting(true);
    onError('');
    try {
      const result = await printSlipsApi.create(book.book_id, {
        user_id: user.id || null,
        requester_name: user.name || '',
        requester_email: user.email || '',
        student_id: user.student_id || '',
        course: user.course || '',
        year: user.year || '',
        material_type: 'Book',
      });
      if (result.book) onPrinted(result.book);
      window.open(result.print_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      onError(e.message);
    } finally {
      setPrinting(false);
    }
  }

  return createPortal(
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.modalHead}>
          <h3 style={S.modalTitle}>Book details</h3>
          <button onClick={onClose} style={S.iconButton}>x</button>
        </div>
        <BookCover book={book} height={172} />
        <div style={{ marginTop: 14 }}>
          <div style={{ ...S.bookTitle, fontSize: 17 }}>{book.title}</div>
          {book.subtitle && <div style={S.subtle}>{book.subtitle}</div>}
          <div style={{ ...S.bookAuthor, marginTop: 6 }}>{(book.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
          <Availability book={book} large />
          <div style={S.infoGrid}>
            {[
              ['ISBN', book.isbn],
              ['Publisher', book.publisher?.name],
              ['Year', book.publication_year],
              ['Format', book.format],
              ['Language', book.language],
              ['Shelf location', shelfLocation(book)],
            ].filter(([, value]) => value).map(([label, value]) => (
              <div key={label} style={S.infoCell}>
                <div style={S.infoLabel}>{label}</div>
                <div style={S.infoValue}>{value}</div>
              </div>
            ))}
          </div>
          {book.description && <p style={S.description}>{book.description}</p>}
          <div style={S.modalFoot}>
            <button onClick={onClose} style={S.secondaryButton}>Close</button>
            <button
              onClick={printSlip}
              disabled={available <= 0 || printing}
              style={{ ...S.printButton, opacity: available > 0 && !printing ? 1 : 0.45 }}
            >
              {printing ? 'Generating...' : 'Print reference slip'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function shelfLocation(book) {
  if (book.shelf_location) return book.shelf_location;
  return (book.copies || []).find((copy) => copy.location)?.location || '';
}

function Availability({ book, large = false }) {
  const total = book.total_copies_count ?? book.copies_count ?? book.copies?.length ?? 0;
  const available = book.available_copies_count ?? (book.copies?.filter((copy) => copy.status === 'Available').length ?? 0);
  const printed = book.printed_copies_count ?? book.borrowed_copies_count ?? (book.copies?.filter((copy) => copy.status === 'Checked Out').length ?? 0);

  return (
    <div style={{ ...S.availability, ...(large ? { justifyContent: 'center', padding: '8px 10px' } : {}) }}>
      <span style={{ color: available > 0 ? '#15803d' : '#b91c1c' }}>{available > 0 ? `${available} available` : 'Unavailable'}</span>
      <span>Total {total}</span>
      {printed > 0 && <span>{printed} printed</span>}
    </div>
  );
}

function coverUrl(book) {
  if (book.cover_image_url) return book.cover_image_url;
  const isbn = normalizeIsbn(book.isbn);
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '';
}

function BookCover({ book, height }) {
  const [err, setErr] = useState(false);
  const url = !err ? coverUrl(book) : '';

  if (url) {
    return (
      <div style={{ ...S.cover, height }}>
        <img
          src={url}
          onError={() => setErr(true)}
          alt={book.title || 'Book cover'}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div style={{ ...S.cover, height, background: '#0f2744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, letterSpacing: 1 }}>
      BOOK
    </div>
  );
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function normalizeIsbn(value) {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

const S = {
  hero: { background: 'linear-gradient(135deg,#0f2744,#1a4a7a 55%,#1a7a4a)', padding: '28px 24px 32px', textAlign: 'center' },
  heroTitle: { fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 },
  heroCopy: { fontSize: 12, color: 'rgba(255,255,255,.72)', marginBottom: 18 },
  searchBar: { display: 'flex', maxWidth: 520, margin: '0 auto' },
  searchInput: { flex: 1, padding: '10px 14px', border: 'none', borderRadius: '8px 0 0 8px', fontSize: 13, fontFamily: 'inherit', outline: 'none', minWidth: 0 },
  searchButton: { background: '#f0a500', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, padding: '10px 16px', borderRadius: '0 8px 8px 0', fontFamily: 'inherit' },
  section: { padding: '16px 20px' },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0, marginBottom: 10 },
  authorRow: { display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 },
  authorButton: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, border: 0, background: 'transparent', fontFamily: 'inherit' },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#1e40af', border: '2px solid #e2e8f0' },
  authorName: { fontSize: 10, color: '#4a5568', textAlign: 'center', maxWidth: 64, lineHeight: 1.3 },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  pill: { padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, border: '1px solid #e2e8f0', background: '#fff', color: '#4a5568', fontFamily: 'inherit' },
  pillActive: { background: '#0f2744', color: '#fff' },
  booksSection: { padding: '0 20px 20px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' },
  cover: { width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: 8 },
  cardBody: { padding: '9px 10px' },
  bookTitle: { fontSize: 12, fontWeight: 700, color: '#1a202c', lineHeight: 1.35 },
  bookAuthor: { fontSize: 10, color: '#2563eb' },
  shelfText: { fontSize: 10, color: '#92400e', marginTop: 4, fontWeight: 800 },
  availability: { display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 7, fontSize: 10, fontWeight: 700, color: '#64748b' },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 48, fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 },
  modal: { background: '#fff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 14, fontWeight: 700, margin: 0 },
  iconButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, marginTop: 12 },
  infoCell: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 10px' },
  infoLabel: { fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 },
  infoValue: { fontSize: 12, fontWeight: 700, color: '#1a202c' },
  description: { fontSize: 11, color: '#4a5568', lineHeight: 1.7, marginTop: 12 },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' },
  secondaryButton: { fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontFamily: 'inherit' },
  printButton: { fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#f0a500', color: '#fff', fontFamily: 'inherit' },
  subtle: { fontSize: 11, color: '#64748b' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 6, padding: '9px 10px', fontSize: 12 },
};
