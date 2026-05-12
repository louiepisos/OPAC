import React, { useEffect, useState } from 'react';
import { statsApi, booksApi } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  useEffect(() => {
    statsApi.get().then(setStats).catch(()=>{});
    booksApi.list({ per_page:5, sort:'created_at', dir:'desc' }).then(r=>setBooks(r.data||[])).catch(()=>{});
  }, []);

  const bars = stats ? Object.entries(stats.formats||{}).map(([lbl,val])=>({lbl,val})) : [];
  const maxBar = Math.max(...bars.map(b=>b.val), 1);

  return (
    <div>
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
          {[
            { label:'Total Books',  val:stats.total_books,     grad:'linear-gradient(90deg,#3b82f6,#60a5fa)' },
            { label:'Available',    val:stats.available_copies,grad:'linear-gradient(90deg,#1a7a4a,#2ecc8a)' },
            { label:'Borrowed',     val:stats.borrowed_copies, grad:'linear-gradient(90deg,#f59e0b,#fbbf24)' },
            { label:'Authors',      val:stats.total_authors,   grad:'linear-gradient(90deg,#e03e3e,#f87171)' },
          ].map(s=>(
            <div key={s.label} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.grad }} />
              <div style={{ fontSize:26, fontWeight:700, color:'#1a202c' }}>{s.val ?? '—'}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#1a202c', marginBottom:14 }}>Books by format</div>
          {bars.length===0 && <div style={{ color:'#94a3b8', fontSize:12 }}>No data yet.</div>}
          {bars.map(b=>(
            <div key={b.lbl} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ fontSize:11, color:'#4a5568', width:50, flexShrink:0 }}>{b.lbl}</div>
              <div style={{ flex:1, height:8, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:99, background:'linear-gradient(90deg,#0f2744,#2563eb)', width:`${(b.val/maxBar)*100}%`, transition:'width .4s' }} />
              </div>
              <div style={{ fontSize:10, color:'#94a3b8', width:24, textAlign:'right', fontFamily:'monospace' }}>{b.val}</div>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'#1a202c', marginBottom:14 }}>Recently added books</div>
          {books.map(b=>(
            <div key={b.book_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
              <BookThumb isbn={b.isbn} title={b.title} coverImage={b.cover_image_url} size={32} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#1a202c', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.title}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>{b.format} - {b.publication_year||'-'}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:99, background:b.available_copies_count>0?'#f0fdf4':'#fef2f2', color:b.available_copies_count>0?'#15803d':'#b91c1c', flexShrink:0 }}>
                {b.available_copies_count>0?`${b.available_copies_count} avail`:'None'}
              </span>
            </div>
          ))}
          {books.length===0 && <p style={{ color:'#94a3b8', fontSize:12 }}>No books yet.</p>}
        </div>
      </div>
    </div>
  );
}

function BookThumb({ isbn, title, coverImage, size=32 }) {
  const [err, setErr] = useState(false);
  const src = coverImage || (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg` : '');
  if (src && !err)
    return <img
      src={src}
      onError={()=>setErr(true)}
      alt={title}
      style={{ width:size, height:size, borderRadius:4, objectFit:'contain', flexShrink:0, background:'#e2e8f0' }}
    />;
  return <div style={{ width:size, height:size, borderRadius:4, background:'#0f2744', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:size*.5 }}>BOOK</div>;
}
