import React, { useState, useEffect } from 'react';
import { usersApi } from '../../lib/api';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(false);

  function load() {
    setLoading(true);
    usersApi.list({ per_page:50 }).then(r=>setStudents(r.data||[])).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); }, []);

  const filtered = students.filter(s=>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  function initials(name='') { return name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(); }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:'#1a202c' }}>Students & Users ({filtered.length})</span>
      </div>
      <div style={{ position:'relative', marginBottom:14 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." style={{ width:'100%', padding:'8px 10px 8px 34px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:12, outline:'none', fontFamily:'inherit', boxSizing:'border-box', background:'#fff' }} />
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:12, pointerEvents:'none' }}>🔍</span>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8fafc' }}>
              {['Student','Email','Course','Role','Action'].map(h=>(
                <th key={h} style={{ textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.07em', padding:'10px 14px', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id}>
                <td style={{ padding:'11px 14px', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:'#0f2744', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{initials(s.name)}</div>
                    <span style={{ fontSize:12, fontWeight:500, color:'#1a202c' }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding:'11px 14px', fontSize:12, color:'#4a5568', borderBottom:'1px solid #f1f5f9' }}>{s.email}</td>
                <td style={{ padding:'11px 14px', fontSize:12, color:'#4a5568', borderBottom:'1px solid #f1f5f9' }}>{s.course||'—'}</td>
                <td style={{ padding:'11px 14px', borderBottom:'1px solid #f1f5f9' }}>
                  <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99, background:s.role==='admin'?'#eff6ff':'#f0fdf4', color:s.role==='admin'?'#1d4ed8':'#15803d', textTransform:'capitalize' }}>{s.role||'student'}</span>
                </td>
                <td style={{ padding:'11px 14px', borderBottom:'1px solid #f1f5f9' }}>
                  <button onClick={()=>{ if(confirm('Delete user?')) usersApi.delete(s.id).then(load); }} style={{ fontSize:10, padding:'4px 10px', borderRadius:6, border:'none', background:'#e03e3e', color:'#fff', cursor:'pointer', fontFamily:'inherit' }}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && (
              <tr><td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', padding:48, fontSize:12 }}>No students found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}