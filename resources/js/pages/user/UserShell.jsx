import React, { useState } from 'react';
import UserHome    from './UserHome';
import UserHistory from './UserHistory';
import UserProfile from './UserProfile';

export default function UserShell({ user, onLogout }) {
  const [page, setPage] = useState('home');
  const initials = name => (name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', width:'100%', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>
      {/* Top nav */}
      <div style={{ background:'#0f2744', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'.08em' }}>OPAC</span>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {[['home','Home'],['history','My History']].map(([p,lbl]) => (
            <span
              key={p}
              onClick={() => setPage(p)}
              style={{
                fontSize:11, fontWeight:500, cursor:'pointer',
                color: page===p ? '#fff' : 'rgba(255,255,255,.65)',
                borderBottom: page===p ? '2px solid #2ecc8a' : '2px solid transparent',
                paddingBottom:2,
              }}
            >{lbl}</span>
          ))}
          <div onClick={() => setPage('profile')} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'#1a7a4a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
              {initials(user.name)}
            </div>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.8)', fontWeight:500 }}>{firstName}</span>
          </div>
          <span onClick={onLogout} style={{ fontSize:11, color:'rgba(255,255,255,.4)', cursor:'pointer' }}>Sign out</span>
        </div>
      </div>
      {/* Page */}
      <div style={{ flex:1, overflowY:'auto', background:'#f4f6fa' }}>
        {page === 'home'    && <UserHome    user={user} />}
        {page === 'history' && <UserHistory user={user} />}
        {page === 'profile' && <UserProfile user={user} onBack={() => setPage('home')} />}
      </div>
    </div>
  );
}