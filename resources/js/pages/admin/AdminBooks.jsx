import React, { useEffect, useMemo, useState } from 'react';
import { authorsApi, booksApi, isbnApi, printSlipsApi, subjectsApi } from '../../lib/api';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  isbn: '',
  publisher_name: '',
  publication_year: '',
  published_date: '',
  edition: '',
  description: '',
  cover_image_url: '',
  language: '',
  format: 'Print',
  copy_count: 1,
  shelf_location: '',
  author_ids: [],
  author_names_text: '',
  author_details: [],
  subject_names_text: '',
};

export default function AdminBooks({ user }) {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingIsbn, setFetchingIsbn] = useState(false);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [duplicateIsbn, setDuplicateIsbn] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  function loadBooks(p = page) {
    setLoading(true);
    setError('');
    const params = { page: p, per_page: 9 };
    if (search) params.q = search;
    booksApi.list(params)
      .then((r) => {
        setBooks(r.data || []);
        setMeta(r);
        setPage(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  function loadLookups() {
    authorsApi.list({ per_page: 200 }).then((r) => setAuthors(r.data || [])).catch((e) => setError(e.message || 'Unable to load authors.'));
    subjectsApi.list().then(setSubjects).catch((e) => setError(e.message || 'Unable to load categories.'));
  }

  useEffect(() => {
    loadBooks(1);
    loadLookups();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadBooks(1), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const existingSubjectNames = useMemo(
    () => subjects.map((s) => s.subject_name).join(', '),
    [subjects]
  );

  function openAdd() {
    setError('');
    setNotice('');
    setDuplicateIsbn(false);
    setForm(EMPTY_FORM);
    setModal({ mode: 'add' });
  }

  function openEdit(book) {
    setError('');
    setNotice('');
    setDuplicateIsbn(false);
    setForm({
      ...EMPTY_FORM,
      title: book.title || '',
      subtitle: book.subtitle || '',
      isbn: book.isbn || '',
      publisher_name: book.publisher?.name || '',
      publication_year: book.publication_year || '',
      published_date: book.published_date ? String(book.published_date).slice(0, 10) : '',
      edition: book.edition || '',
      description: book.description || '',
      cover_image_url: book.cover_image_url || '',
      language: book.language || '',
      format: book.format || 'Print',
      copy_count: book.total_copies_count ?? book.copies_count ?? book.copies?.length ?? 0,
      shelf_location: shelfLocation(book),
      author_ids: (book.authors || []).map((a) => a.author_id),
      author_details: (book.authors || []).map((a) => ({
        name: a.name,
        birth_date: a.birth_date ? String(a.birth_date).slice(0, 10) : '',
        death_date: a.death_date ? String(a.death_date).slice(0, 10) : '',
        bio: a.bio || '',
      })),
      subject_names_text: (book.subjects || []).map((s) => s.subject_name).join(', '),
    });
    setModal({ mode: 'edit', book });
  }

  async function fetchIsbn() {
    const isbn = normalizeIsbn(form.isbn);
    if (isbn.length < 10) {
      setError('Enter a 10 or 13 digit ISBN before fetching.');
      return;
    }

    setFetchingIsbn(true);
    setError('');
    setNotice('');
    setDuplicateIsbn(false);

    try {
      const result = await isbnApi.lookup(isbn);
      if (result.duplicate && result.existing_book?.book_id !== modal?.book?.book_id) {
        setDuplicateIsbn(true);
        setError(`This ISBN already exists on "${result.existing_book.title}".`);
        return;
      }

      const b = result.book || {};
      setForm((prev) => ({
        ...prev,
        isbn,
        title: b.title || prev.title,
        subtitle: b.subtitle || prev.subtitle,
        publisher_name: b.publisher_name || prev.publisher_name,
        publication_year: b.publication_year || prev.publication_year,
        published_date: b.published_date || prev.published_date,
        description: b.description || prev.description,
        cover_image_url: b.cover_image_url || prev.cover_image_url,
        language: b.language || prev.language,
        author_names_text: (b.author_names || []).join(', ') || prev.author_names_text,
        author_details: b.author_details || [],
        subject_names_text: (b.subject_names || []).join(', ') || prev.subject_names_text,
      }));
      setNotice('ISBN details loaded. Review and edit anything before saving.');
    } catch (e) {
      setError(e.message);
    } finally {
      setFetchingIsbn(false);
    }
  }

  async function save() {
    setError('');
    setNotice('');

    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (duplicateIsbn) {
      setError('Use a different ISBN before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = payloadFromForm(form);
      if (modal.mode === 'add') {
        await booksApi.create(payload);
      } else {
        await booksApi.update(modal.book.book_id, payload);
      }
      setModal(null);
      await Promise.all([loadBooks(page), Promise.resolve(loadLookups())]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(id) {
    if (!confirm('Delete this book?')) return;
    try {
      await booksApi.delete(id);
      loadBooks(page);
    } catch (e) {
      setError(e.message);
    }
  }

  async function refreshBookAfterInventoryChange(book, message) {
    setNotice(message);
    loadBooks(page);
    if (detail?.book_id === book.book_id) {
      booksApi.get(book.book_id).then(setDetail).catch((e) => setError(e.message || 'Unable to refresh book details.'));
    }
  }

  async function returnOne(book) {
    try {
      await booksApi.returnCopy(book.book_id);
      refreshBookAfterInventoryChange(book, 'Manual +1 complete. A printed copy was returned to available inventory.');
    } catch (e) {
      setError(e.message || 'Unable to return this printed copy.');
    }
  }

  async function decreaseOne(book) {
    try {
      await booksApi.manualPrintCopy(book.book_id);
      refreshBookAfterInventoryChange(book, 'Manual -1 complete. One available copy was marked as printed/out.');
    } catch (e) {
      setError(e.message || 'Unable to manually decrease available copies.');
    }
  }

  async function printBook(book) {
    setError('');
    setNotice('');
    try {
      const result = await printSlipsApi.create(book.book_id, {
        user_id: user?.id || null,
        requester_name: user?.name || 'Admin print',
        requester_email: user?.email || null,
        material_type: book.format || 'Book',
      });
      if (result.book) {
        setBooks((prev) => prev.map((item) => (item.book_id === result.book.book_id ? { ...item, ...result.book } : item)));
        setDetail((prev) => (prev?.book_id === result.book.book_id ? { ...prev, ...result.book } : prev));
      } else {
        loadBooks(page);
      }
      setNotice('Print slip generated and inventory updated.');
      window.open(result.print_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setError(e.message || 'Unable to print this book slip.');
    }
  }

  return (
    <div>
      <div style={S.toolbar}>
        <div>
          <div style={S.title}>All Books ({meta.total || 0})</div>
          <div style={S.subtle}>Search, add, print, and track metadata and available copies.</div>
        </div>
        <button onClick={openAdd} style={S.primaryButton}>Add book</button>
      </div>

      {error && !modal && <div style={S.error}>{error}</div>}
      {notice && !modal && <div style={S.notice}>{notice}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search title, author, ISBN, subject, publisher, shelf..."
        style={{ ...S.input, marginBottom: 14 }}
      />

      <div style={S.grid}>
        {books.map((book) => (
          <div key={book.book_id} style={S.card} className="opac-hover-lift" onClick={() => booksApi.get(book.book_id).then(setDetail).catch((e) => { setError(e.message || 'Unable to load book details.'); setDetail(book); })}>
            <BookCover book={book} height={140} width={96} />
            <div style={S.cardBody}>
              <div style={S.bookTitle}>{book.title}</div>
              <div style={S.bookAuthor}>{(book.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
              <Inventory book={book} />
              <div style={S.actions}>
                <button onClick={(e) => { e.stopPropagation(); openEdit(book); }} style={S.secondaryButton}>Edit</button>
                <button
                  onClick={(e) => { e.stopPropagation(); printBook(book); }}
                  disabled={(book.available_copies_count || 0) <= 0}
                  style={{ ...S.printButton, opacity: (book.available_copies_count || 0) > 0 ? 1 : 0.45 }}
                >
                  Print slip
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); decreaseOne(book); }}
                  disabled={(book.available_copies_count || 0) <= 0}
                  style={{ ...S.secondaryButton, opacity: (book.available_copies_count || 0) > 0 ? 1 : 0.45 }}
                  title="Use when a user took/printed a book without using the system."
                >
                  Manual -1
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); returnOne(book); }}
                  disabled={(book.borrowed_copies_count || 0) <= 0}
                  style={{ ...S.secondaryButton, opacity: (book.borrowed_copies_count || 0) > 0 ? 1 : 0.45 }}
                  title="Use when a book comes back without a system slip."
                >
                  Manual +1
                </button>
                <button onClick={(e) => { e.stopPropagation(); del(book.book_id); }} style={S.dangerButton}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!loading && books.length === 0 && <div style={S.empty}>No books found.</div>}
      </div>

      {loading && <div style={S.empty}>Loading books...</div>}

      {meta.last_page > 1 && (
        <div style={S.pagination}>
          <span style={S.subtle}>Page {page} of {meta.last_page}</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => loadBooks(p)} style={{ ...S.pageButton, ...(p === page ? S.pageActive : {}) }}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal} className="opac-modal-pop">
            <div style={S.modalHead}>
              <div>
                <h3 style={S.modalTitle}>{modal.mode === 'add' ? 'Add new book' : 'Edit book'}</h3>
                <div style={S.subtle}>Use ISBN fetch as a starting point, then review before saving.</div>
              </div>
              <button onClick={() => setModal(null)} style={S.iconButton}>x</button>
            </div>

            {error && <div style={S.error}>{error}</div>}
            {notice && <div style={S.notice}>{notice}</div>}

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>ISBN</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={S.input}
                    value={form.isbn}
                    onChange={(e) => { setForm({ ...form, isbn: e.target.value }); setDuplicateIsbn(false); }}
                    placeholder="9780451524935"
                  />
                  <button onClick={fetchIsbn} disabled={fetchingIsbn} style={S.secondaryButton}>
                    {fetchingIsbn ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>
              </div>
              <div>
                <label style={S.label}>Total copies</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  value={form.copy_count}
                  onChange={(e) => setForm({ ...form, copy_count: e.target.value })}
                />
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Title *</label>
                <input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Subtitle</label>
                <input style={S.input} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Publisher</label>
                <input style={S.input} value={form.publisher_name} onChange={(e) => setForm({ ...form, publisher_name: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Published date</label>
                <input style={S.input} type="date" value={form.published_date} onChange={(e) => setForm({ ...form, published_date: e.target.value })} />
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Publication year</label>
                <input style={S.input} type="number" value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Format</label>
                <select style={S.input} value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option>Print</option>
                  <option>Ebook</option>
                  <option>Audio</option>
                </select>
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Shelf location</label>
                <input
                  style={S.input}
                  value={form.shelf_location}
                  onChange={(e) => setForm({ ...form, shelf_location: e.target.value })}
                  placeholder="Shelf A-3, Row 2"
                />
              </div>
              <div style={S.locationHint}>
                This location is shown to users and applied to all copies of this book.
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Language</label>
                <input style={S.input} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="English" />
              </div>
              <div>
                <label style={S.label}>Edition</label>
                <input style={S.input} value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} placeholder="1st" />
              </div>
            </div>

            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Existing authors</label>
                <div style={S.checkList}>
                  {authors.map((author) => (
                    <label key={author.author_id} style={S.checkRow}>
                      <input
                        type="checkbox"
                        checked={form.author_ids.includes(author.author_id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...form.author_ids, author.author_id]
                            : form.author_ids.filter((id) => id !== author.author_id);
                          setForm({ ...form, author_ids: ids });
                        }}
                      />
                      {author.name}
                    </label>
                  ))}
                  {authors.length === 0 && <div style={S.subtle}>No authors yet. Add names below.</div>}
                </div>
              </div>
              <div>
                <label style={S.label}>New authors</label>
                <input
                  style={S.input}
                  value={form.author_names_text}
                  onChange={(e) => setForm({ ...form, author_names_text: e.target.value })}
                  placeholder="Separate names with commas"
                />
                {form.author_details.length > 0 && (
                  <div style={S.authorPreview}>
                    {form.author_details.map((author) => (
                      <div key={author.name} style={S.authorPreviewItem}>
                        <strong>{author.name}</strong>
                        <span>{dateRange(author)}</span>
                        {author.bio && <small>{author.bio}</small>}
                      </div>
                    ))}
                  </div>
                )}
                <label style={{ ...S.label, marginTop: 10 }}>Categories / genre</label>
                <input
                  style={S.input}
                  value={form.subject_names_text}
                  onChange={(e) => setForm({ ...form, subject_names_text: e.target.value })}
                  placeholder={existingSubjectNames || 'Fiction, Reference, Science'}
                />
              </div>
            </div>

            <div>
              <label style={S.label}>Cover image URL</label>
              <input style={S.input} value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
            </div>

            <div style={S.previewRow}>
              <BookCover book={{ ...form, cover_image_url: form.cover_image_url, isbn: form.isbn, title: form.title }} height={128} />
              <div style={{ flex: 1 }}>
                <label style={S.label}>Description</label>
                <textarea
                  rows={5}
                  style={{ ...S.input, resize: 'vertical', minHeight: 116 }}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div style={S.modalFoot}>
              <button onClick={() => setModal(null)} style={S.secondaryButton}>Cancel</button>
              <button onClick={save} disabled={saving || fetchingIsbn} style={S.primaryButton}>{saving ? 'Saving...' : 'Save book'}</button>
            </div>
          </div>
        </div>
      )}

      {detail && <BookDetailModal book={detail} onClose={() => setDetail(null)} onEdit={() => { openEdit(detail); setDetail(null); }} onReturn={() => returnOne(detail)} onPrint={() => printBook(detail)} onDecrease={() => decreaseOne(detail)} />}
    </div>
  );
}

function payloadFromForm(form) {
  return {
    title: form.title.trim(),
    subtitle: emptyToNull(form.subtitle),
    isbn: emptyToNull(normalizeIsbn(form.isbn)),
    publisher_name: emptyToNull(form.publisher_name),
    publication_year: form.publication_year ? Number(form.publication_year) : null,
    published_date: emptyToNull(form.published_date),
    edition: emptyToNull(form.edition),
    description: emptyToNull(form.description),
    cover_image_url: emptyToNull(form.cover_image_url),
    language: emptyToNull(form.language),
    format: form.format,
    copy_count: Math.max(0, Number(form.copy_count) || 0),
    shelf_location: emptyToNull(form.shelf_location),
    author_ids: form.author_ids,
    author_names: parseList(form.author_names_text),
    author_details: detailsForNames(form.author_details, form.author_names_text),
    subject_names: parseList(form.subject_names_text),
  };
}

function emptyToNull(value) {
  const next = String(value || '').trim();
  return next === '' ? null : next;
}

function normalizeIsbn(value) {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function detailsForNames(details, text) {
  const wanted = parseList(text).map((name) => name.toLowerCase());
  return (details || [])
    .filter((detail) => detail?.name && wanted.includes(detail.name.toLowerCase()))
    .map((detail) => ({
      name: detail.name,
      birth_date: emptyToNull(detail.birth_date),
      death_date: emptyToNull(detail.death_date),
      bio: emptyToNull(detail.bio),
    }));
}

function shelfLocation(book) {
  if (book.shelf_location) return book.shelf_location;
  return (book.copies || []).find((copy) => copy.location)?.location || '';
}

function dateRange(author) {
  const birth = author.birth_date ? String(author.birth_date).slice(0, 4) : '';
  const death = author.death_date ? String(author.death_date).slice(0, 4) : '';
  if (birth || death) return `${birth || '?'}-${death || 'present'}`;
  return 'dates unavailable';
}

function coverUrl(book) {
  const imageUrl = String(book.cover_image_url || '').trim();
  if (imageUrl) return imageUrl;
  const isbn = normalizeIsbn(book.isbn);
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '';
}

function BookCover({ book, height, width }) {
  const [err, setErr] = useState(false);
  const url = !err ? coverUrl(book) : '';
  const placeholderHeight = Math.min(height || 80, 80);
  const coverStyle = { ...S.cover, height };
  if (width) {
    coverStyle.width = width;
    coverStyle.minWidth = width;
  }

  if (url) {
    return (
      <div style={coverStyle}>
        <img
          src={url}
          alt={book.title || 'Book cover'}
          onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#f8fafc' }}
        />
      </div>
    );
  }

  return (
    <div style={{ ...coverStyle, minHeight: placeholderHeight, width: width || '100%', background: '#0f2744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, letterSpacing: 1 }}>
      NO COVER
    </div>
  );
}

function Inventory({ book }) {
  const total = book.total_copies_count ?? book.copies_count ?? 0;
  const available = book.available_copies_count ?? 0;
  const printed = book.borrowed_copies_count ?? 0;

  return (
    <div style={S.inventory}>
      <span>Total {total}</span>
      <span>Available {available}</span>
      <span>Printed {printed}</span>
      {shelfLocation(book) && <span>Shelf {shelfLocation(book)}</span>}
    </div>
  );
}

function BookDetailModal({ book, onClose, onEdit, onReturn, onPrint, onDecrease }) {
  return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: 520 }} className="opac-modal-pop">
        <div style={S.modalHead}>
          <h3 style={S.modalTitle}>Book details</h3>
          <button onClick={onClose} style={S.iconButton}>x</button>
        </div>
        <div style={S.detailCoverWrapper}>
          <BookCover book={book} height={180} width={120} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ ...S.bookTitle, fontSize: 18 }}>{book.title}</div>
          {book.subtitle && <div style={S.subtle}>{book.subtitle}</div>}
          <div style={{ ...S.bookAuthor, marginTop: 6 }}>{(book.authors || []).map((a) => a.name).join(', ') || 'Unknown author'}</div>
          <Inventory book={book} />
          <div style={S.infoGrid}>
            {[
              ['ISBN', book.isbn],
              ['Publisher', book.publisher?.name],
              ['Year', book.publication_year],
              ['Format', book.format],
              ['Language', book.language],
              ['Edition', book.edition],
              ['Shelf location', shelfLocation(book)],
            ].filter(([, value]) => value).map(([label, value]) => (
              <div key={label} style={S.infoCell}>
                <div style={S.label}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          {book.description && <p style={S.description}>{book.description}</p>}
          <div style={S.modalFoot}>
            <button onClick={onClose} style={S.secondaryButton}>Close</button>
            <button onClick={onPrint} disabled={(book.available_copies_count || 0) <= 0} style={{ ...S.printButton, opacity: (book.available_copies_count || 0) > 0 ? 1 : 0.45 }}>Print slip</button>
            <button onClick={onDecrease} disabled={(book.available_copies_count || 0) <= 0} style={S.secondaryButton}>Manual -1</button>
            <button onClick={onReturn} disabled={(book.borrowed_copies_count || 0) <= 0} style={S.secondaryButton}>Manual +1</button>
            <button onClick={onEdit} style={S.primaryButton}>Edit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: 700, color: '#1a202c' },
  subtle: { fontSize: 11, color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 },
  card: { display: 'flex', gap: 12, alignItems: 'stretch', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'transform .18s ease, box-shadow .18s ease, border-color .18s ease' },
  cardBody: { padding: 12, flex: 1, minWidth: 0 },
  bookTitle: { fontSize: 13, fontWeight: 700, color: '#1a202c', lineHeight: 1.35 },
  bookAuthor: { fontSize: 11, color: '#2563eb', marginTop: 3, minHeight: 16 },
  cover: { width: '100%', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflow: 'hidden', boxSizing: 'border-box', padding: 0 },
  inventory: { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 9 },
  actions: { display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: '#1a202c', outline: 'none', background: '#fff' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0 },
  primaryButton: { fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#1a7a4a', color: '#fff', fontFamily: 'inherit' },
  printButton: { fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 6, border: 'none', background: '#f0a500', color: '#fff', fontFamily: 'inherit' },
  secondaryButton: { fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1f2937', fontFamily: 'inherit' },
  dangerButton: { fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontFamily: 'inherit' },
  pageButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 11, fontFamily: 'inherit' },
  pageActive: { background: '#0f2744', color: '#fff' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0' },
  empty: { gridColumn: '1/-1', textAlign: 'center', color: '#64748b', padding: 36, fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 },
  modal: { background: '#fff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 760, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.22)' },
  modalHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#1a202c', margin: 0 },
  iconButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginBottom: 12 },
  checkList: { border: '1px solid #cbd5e1', borderRadius: 6, padding: 8, maxHeight: 128, overflowY: 'auto' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#334155', padding: '3px 0' },
  previewRow: { display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12, alignItems: 'stretch', marginTop: 12 },
  detailCoverWrapper: { display: 'flex', justifyContent: 'center', marginBottom: 16 },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 6, padding: '9px 10px', fontSize: 12, marginBottom: 12 },
  notice: { background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 6, padding: '9px 10px', fontSize: 12, marginBottom: 12 },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8, marginTop: 12 },
  infoCell: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 9 },
  description: { fontSize: 12, lineHeight: 1.65, color: '#475569', marginTop: 12 },
  authorPreview: { marginTop: 8, display: 'grid', gap: 6 },
  authorPreviewItem: { border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, fontSize: 11, color: '#475569', display: 'grid', gap: 2 },
  locationHint: { display: 'flex', alignItems: 'center', minHeight: 36, fontSize: 11, lineHeight: 1.45, color: '#64748b', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '8px 10px' },
};
