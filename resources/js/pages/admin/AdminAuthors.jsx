import React, { useEffect, useState } from 'react';
import { authorsApi } from '../../lib/api';

const EMPTY_AUTHOR = {
  name: '',
  author_type: 'Personal',
  birth_date: '',
  death_date: '',
  bio: '',
};

export default function AdminAuthors() {
  const [authors, setAuthors] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_AUTHOR);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load(p = page) {
    setLoading(true);
    const params = { page: p, per_page: 12 };
    if (search) params.q = search;
    return authorsApi.list(params)
      .then((r) => {
        setAuthors(r.data || []);
        setMeta(r);
        setPage(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openAdd() {
    setError('');
    setForm(EMPTY_AUTHOR);
    setModal({ mode: 'add' });
  }

  function openEdit(author) {
    setError('');
    setForm({
      name: author.name || '',
      author_type: author.author_type || 'Personal',
      birth_date: author.birth_date ? String(author.birth_date).slice(0, 10) : '',
      death_date: author.death_date ? String(author.death_date).slice(0, 10) : '',
      bio: author.bio || '',
    });
    setModal({ mode: 'edit', author });
  }

  async function save() {
    setError('');
    if (!form.name.trim()) {
      setError('Author name is required.');
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      author_type: form.author_type,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      bio: form.bio.trim() || null,
    };

    try {
      if (modal.mode === 'add') {
        await authorsApi.create(payload);
      } else {
        await authorsApi.update(modal.author.author_id, payload);
      }
      setModal(null);
      load(page);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function del(author) {
    const hasBooks = (author.books_count || 0) > 0;
    const message = hasBooks
      ? `Delete ${author.name}? Their book links will be removed.`
      : `Delete ${author.name}?`;
    if (!confirm(message)) return;

    try {
      await authorsApi.delete(author.author_id);
      load(page);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div style={S.toolbar}>
        <div>
          <div style={S.title}>Authors ({meta.total || 0})</div>
          <div style={S.subtle}>Create, update, and retire catalog authors.</div>
        </div>
        <button onClick={openAdd} style={S.primaryButton}>Add author</button>
      </div>

      {error && !modal && <div style={S.error}>{error}</div>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search authors..."
        style={{ ...S.input, marginBottom: 14, maxWidth: 420 }}
      />

      <div style={S.table}>
        <div style={{ ...S.row, ...S.head }}>
          <div>Name</div>
          <div>Type</div>
          <div>Dates</div>
          <div>Bio</div>
          <div>Books</div>
          <div></div>
        </div>
        {authors.map((author) => (
          <div key={author.author_id} style={S.row}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={S.avatar}>{initials(author.name)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={S.name}>{author.name}</div>
                <div style={S.subtle}>ID {author.author_id}</div>
              </div>
            </div>
            <div>{author.author_type}</div>
            <div>{dateRange(author)}</div>
            <div style={S.bioCell}>{author.bio || 'N/A'}</div>
            <div>{author.books_count || 0}</div>
            <div style={S.actions}>
              <button onClick={() => openEdit(author)} style={S.secondaryButton}>Edit</button>
              <button onClick={() => del(author)} style={S.dangerButton}>Delete</button>
            </div>
          </div>
        ))}
        {!loading && authors.length === 0 && <div style={S.empty}>No authors found.</div>}
        {loading && <div style={S.empty}>Loading authors...</div>}
      </div>

      {meta.last_page > 1 && (
        <div style={S.pagination}>
          <span style={S.subtle}>Page {page} of {meta.last_page}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => load(p)} style={{ ...S.pageButton, ...(p === page ? S.pageActive : {}) }}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <h3 style={S.modalTitle}>{modal.mode === 'add' ? 'Add author' : 'Edit author'}</h3>
              <button onClick={() => setModal(null)} style={S.iconButton}>x</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Name *</label>
              <input style={S.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={S.formGrid}>
              <div>
                <label style={S.label}>Author type</label>
                <select style={S.input} value={form.author_type} onChange={(e) => setForm({ ...form, author_type: e.target.value })}>
                  <option>Personal</option>
                  <option>Corporate</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Birth date</label>
                <input style={S.input} type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Death date</label>
                <input style={S.input} type="date" value={form.death_date} onChange={(e) => setForm({ ...form, death_date: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={S.label}>Short bio</label>
              <textarea
                rows={4}
                style={{ ...S.input, resize: 'vertical', minHeight: 88 }}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Optional author biography"
              />
            </div>
            <div style={S.modalFoot}>
              <button onClick={() => setModal(null)} style={S.secondaryButton}>Cancel</button>
              <button onClick={save} disabled={saving} style={S.primaryButton}>{saving ? 'Saving...' : 'Save author'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function dateRange(author) {
  const birth = author.birth_date ? String(author.birth_date).slice(0, 4) : '';
  const death = author.death_date ? String(author.death_date).slice(0, 4) : '';
  if (birth || death) return `${birth || '?'}-${death || 'present'}`;
  return 'N/A';
}

const S = {
  toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 },
  title: { fontSize: 15, fontWeight: 700, color: '#1a202c' },
  subtle: { fontSize: 11, color: '#64748b' },
  input: { width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: '#1a202c', outline: 'none', background: '#fff' },
  label: { display: 'block', fontSize: 10, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0 },
  table: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' },
  row: { display: 'grid', gridTemplateColumns: 'minmax(190px,1.3fr) 100px 110px minmax(180px,1fr) 60px 150px', gap: 12, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 12, color: '#334155' },
  head: { background: '#f8fafc', color: '#64748b', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0 },
  avatar: { width: 34, height: 34, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  name: { fontSize: 13, fontWeight: 700, color: '#1a202c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' },
  bioCell: { color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  primaryButton: { fontSize: 11, fontWeight: 700, padding: '8px 14px', borderRadius: 6, border: 'none', background: '#1a7a4a', color: '#fff', fontFamily: 'inherit' },
  secondaryButton: { fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#1f2937', fontFamily: 'inherit' },
  dangerButton: { fontSize: 11, fontWeight: 700, padding: '7px 10px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontFamily: 'inherit' },
  empty: { textAlign: 'center', color: '#64748b', padding: 28, fontSize: 12 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 },
  modal: { background: '#fff', borderRadius: 8, padding: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.22)' },
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 700, color: '#1a202c', margin: 0 },
  iconButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 14 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 },
  modalFoot: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 6, padding: '9px 10px', fontSize: 12, marginBottom: 12 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0' },
  pageButton: { width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 11, fontFamily: 'inherit' },
  pageActive: { background: '#0f2744', color: '#fff' },
};
