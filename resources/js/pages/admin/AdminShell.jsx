import React, { useState } from 'react';
import AdminHome      from './AdminHome';
import AdminDashboard from './AdminDashboard';
import AdminBooks     from './AdminBooks';
import AdminAuthors   from './AdminAuthors';
import AdminStudents  from './AdminStudents';

const NAVY = '#0f2744';

const ICONS = {
  home: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:15,height:15,flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  dashboard: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:15,height:15,flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  books: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:15,height:15,flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  ),
  authors: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:15,height:15,flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-3.314 0-6 1.79-6 4v1h12v-1c0-2.21-2.686-4-6-4z"/>
    </svg>
  ),
  students: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:15,height:15,flexShrink:0}}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
};

const NAV = [
  { id:'home',      label:'Home',           section:'Main'    },
  { id:'dashboard', label:'Dashboard',       section:''        },
  { id:'books',     label:'Manage Books',    section:'Library' },
  { id:'authors',   label:'Authors',         section:''        },
  { id:'students',  label:'Manage Students', section:''        },
];
const TITLES = {
  home:'Admin Home', dashboard:'Dashboard',
  books:'Manage Books', authors:'Authors',
  students:'Manage Students',
};

export default function AdminShell({ user, onLogout }) {
  const [page, setPage] = useState('home');
  let section = null;

  return (
    <div style={{ display:'flex', height:'100%', width:'100%', fontFamily:"'DM Sans',sans-serif", overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:172, minWidth:172, background:NAVY, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,.07)', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'.1em' }}>OPAC</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>Admin Panel</div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {NAV.map(n => {
            const showSection = n.section && n.section !== section;
            if (showSection) section = n.section;
            const active = page === n.id;
            return (
              <React.Fragment key={n.id}>
                {showSection && (
                  <div style={{ padding:'14px 12px 4px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', letterSpacing:'.15em', textTransform:'uppercase' }}>
                    {n.section}
                  </div>
                )}
                <button
                  onClick={() => setPage(n.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:9,
                    padding:'9px 12px', margin:'1px 6px', borderRadius:8,
                    cursor:'pointer', border:'none', width:'calc(100% - 12px)',
                    color: active ? '#fff' : 'rgba(255,255,255,.5)',
                    background: active ? 'rgba(46,204,138,.15)' : 'transparent',
                    borderLeft: active ? '2px solid #2ecc8a' : '2px solid transparent',
                    fontSize:12, fontWeight:500, textAlign:'left', fontFamily:'inherit',
                  }}
                >
                  {ICONS[n.id]}
                  {n.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <button
          onClick={onLogout}
          style={{ margin:'10px', padding:'8px 12px', background:'#c0392b', color:'#fff', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', flexShrink:0 }}
        >
          LOG OUT
        </button>
      </div>

      {/* Main area */}
      <div style={{ display:'flex', flexDirection:'column', flex:1, minWidth:0, overflow:'hidden' }}>
        {/* Topbar */}
        <div style={{ height:52, background:'#fff', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:600, color:'#1a202c', flex:1 }}>{TITLES[page]}</span>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f4f6fa', border:'1px solid #e2e8f0', borderRadius:99, padding:'4px 12px 4px 5px' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:NAVY, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>LA</div>
            <span style={{ fontSize:11, fontWeight:500, color:'#4a5568' }}>Librarian Admin</span>
          </div>
        </div>
        {/* Page content */}
        <div style={{ flex:1, overflowY:'auto', padding:20, background:'#f4f6fa' }}>
          {page === 'home'      && <AdminHome      setPage={setPage} />}
          {page === 'dashboard' && <AdminDashboard />}
          {page === 'books'     && <AdminBooks />}
          {page === 'authors'   && <AdminAuthors />}
          {page === 'students'  && <AdminStudents />}
        </div>
      </div>
    </div>
  );
}
