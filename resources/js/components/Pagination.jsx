import React from 'react';

export default function Pagination({ current, last, onPage }) {
  const pages   = Array.from({ length: last }, (_, i) => i + 1);
  const visible = pages.filter(p => p === 1 || p === last || Math.abs(p - current) <= 2);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '.4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
      {visible.map((p, i) => {
        const prev = visible[i - 1];
        return (
          <React.Fragment key={p}>
            {prev && p - prev > 1 && <span style={{ padding: '.4rem', color: '#8a7f72' }}>â€¦</span>}
            <button
              onClick={() => onPage(p)}
              style={{
                padding: '.4rem .75rem', borderRadius: 8,
                border: '1px solid #ddd6c8',
                background: p === current ? '#c9922d' : '#fff',
                color:      p === current ? '#fff'    : '#1a1410',
                cursor: 'pointer', fontSize: '.88rem',
              }}
            >
              {p}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}