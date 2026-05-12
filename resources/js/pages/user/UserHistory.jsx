import React, { useEffect, useState } from 'react';
import { printSlipsApi } from '../../lib/api';

export default function UserHistory({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { per_page: 20 };
    if (user.id) params.user_id = user.id;
    else if (user.email) params.requester_email = user.email;

    printSlipsApi.list(params)
      .then((r) => setItems(r.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user.id, user.email]);

  return (
    <div style={{ padding: 20 }}>
      <div style={S.profile}>
        <div style={S.avatar}>{initials(user.name)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{user.name}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{user.email} - {user.course || 'Student'}</div>
        </div>
      </div>

      <div style={S.panel}>
        <div style={S.title}>Print slip history</div>
        {loading && <div style={S.empty}>Loading history...</div>}
        {!loading && items.length === 0 && <div style={S.empty}>Printed reference slips will appear here.</div>}
        {!loading && items.map((item) => (
          <div key={item.print_transaction_id} style={S.item}>
            <div style={{ minWidth: 0 }}>
              <div style={S.bookTitle}>{item.book?.title || 'Untitled book'}</div>
              <div style={S.meta}>{item.slip_number} - {formatDate(item.printed_at || item.created_at)}</div>
            </div>
            <a href={`/print-slips/${item.print_transaction_id}`} target="_blank" rel="noreferrer" style={S.link}>Open</a>
          </div>
        ))}
      </div>
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

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

const S = {
  profile: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 54, height: 54, borderRadius: '50%', background: '#1a7a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' },
  title: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 13, fontWeight: 800, color: '#1a202c' },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: '1px solid #e2e8f0' },
  bookTitle: { fontSize: 13, fontWeight: 700, color: '#1a202c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta: { fontSize: 11, color: '#64748b' },
  link: { fontSize: 11, fontWeight: 800, color: '#1d4ed8', textDecoration: 'none' },
  empty: { textAlign: 'center', color: '#64748b', padding: 36, fontSize: 12 },
};
