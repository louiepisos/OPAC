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
          <span style={{ fontSize: '1.8rem' }}>ðŸ“–</span>
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