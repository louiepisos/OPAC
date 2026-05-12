import React, { useEffect, useState } from 'react';
import { statsApi } from '../../lib/api';

export default function AdminHome({ setPage }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { statsApi.get().then(setStats).catch(() => {}); }, []);

  const quick = [
    { icon: 'BK', label: 'Manage books', page: 'books', subtitle: stats ? `${stats.total_books ?? 0} books` : 'Loading...' },
    { icon: 'AU', label: 'Authors', page: 'authors', subtitle: stats ? `${stats.total_authors ?? 0} authors` : 'Loading...' },
    { icon: 'ST', label: 'Students', page: 'students', subtitle: stats ? `${stats.total_users ?? 0} users` : 'Loading...' },
    { icon: 'DB', label: 'Dashboard', page: 'dashboard', subtitle: stats ? `${stats.available_copies ?? 0} available` : 'Loading...' },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg,#0f2744 0%,#1a4a7a 60%,#1a7a4a 100%)', borderRadius: 12, padding: '22px 24px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Welcome, Librarian!</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.68)' }}>Manage books, authors, students, and print slips.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,.92)', fontFamily: 'monospace' }}>{timeStr}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: 'monospace' }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 18 }}>
        {quick.map((q) => (
          <button key={q.label} onClick={() => setPage(q.page)} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 10px',
            cursor: 'pointer', textAlign: 'center', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 13, margin: '0 auto 8px', width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{q.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1f2937' }}>{q.label}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{q.subtitle}</div>
          </button>
        ))}
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 18 }}>
          {[
            { label: 'Total Books', val: stats.total_books, grad: 'linear-gradient(90deg,#3b82f6,#60a5fa)' },
            { label: 'Available', val: stats.available_copies, grad: 'linear-gradient(90deg,#1a7a4a,#2ecc8a)' },
            { label: 'Borrowed', val: stats.borrowed_copies, grad: 'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            { label: 'Authors', val: stats.total_authors, grad: 'linear-gradient(90deg,#e03e3e,#f87171)' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.grad }} />
              <div style={{ fontSize: 26, fontWeight: 700, color: '#1a202c', lineHeight: 1 }}>{s.val ?? '-'}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
