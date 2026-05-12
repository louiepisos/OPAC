import React from 'react';

export default function UserProfile({ user, onBack }) {
  const initials = (name) => (name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div style={{ background: '#0f2744', padding: '10px 20px' }}>
        <span onClick={onBack} style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', cursor: 'pointer' }}>Back to home</span>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>{initials(user.name)}</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a202c' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{user.email}</div>
            {user.course && <div style={{ fontSize: 12, color: '#94a3b8' }}>{user.course}{user.year ? ' - ' + user.year : ''}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 24 }}>Profile settings coming soon.</div>
      </div>
    </div>
  );
}
