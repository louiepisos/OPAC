import React, { useState } from 'react';
import { authApi } from '../lib/api';

const C = {
  navy:'#0f2744', green:'#1a7a4a', blue:'#2563eb',
  border:'#e2e8f0', text:'#1a202c', text2:'#4a5568', text3:'#94a3b8',
};

export default function LoginPage({ onLogin }) {
  const [mode, setMode]       = useState('login');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [pass, setPass]   = useState('');

  const [reg, setReg] = useState({
    fname:'', lname:'', email:'', password:'', password2:'',
    student_id:'', year:'', course:'',
  });

  async function doLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await authApi.login({ email, password: pass });
      onLogin(data);
    } catch(err) {
      setError(err.message || 'Invalid credentials.');
    } finally { setLoading(false); }
  }

  async function doRegister(e) {
    e.preventDefault();
    if (reg.password !== reg.password2) { setError('Passwords do not match.'); return; }
    if (!reg.fname || !reg.email || !reg.password || !reg.course) { setError('Please fill all required fields.'); return; }
    setError(''); setLoading(true);
    try {
      const data = await authApi.register({
        name: reg.fname + ' ' + reg.lname,
        email: reg.email, password: reg.password,
        student_id: reg.student_id, year: reg.year, course: reg.course,
      });
      onLogin(data);
    } catch(err) {
      setError(err.message || 'Registration failed.');
    } finally { setLoading(false); }
  }

  const inp = { width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:8, fontSize:13, color:C.text, outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const lbl = { display:'block', fontSize:11, fontWeight:600, color:C.text2, marginBottom:5 };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:`linear-gradient(135deg, ${C.navy} 0%, #1a4a7a 55%, ${C.green} 100%)`,
      position:'relative', overflow:'hidden', fontFamily:"'DM Sans', sans-serif",
    }}>
      {[{w:400,h:400,t:-100,l:-100},{w:300,h:300,b:-80,r:-60}].map((s,i)=>(
        <div key={i} style={{ position:'absolute', borderRadius:'50%', opacity:.06, background:'#fff', width:s.w, height:s.h, top:s.t, left:s.l, bottom:s.b, right:s.r }} />
      ))}

      <div style={{ background:'#fff', borderRadius:16, padding:'36px 32px', width:'100%', maxWidth: mode==='register'?440:400, boxShadow:'0 24px 64px rgba(0,0,0,.25)', position:'relative', zIndex:1, margin:'1rem' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'.06em' }}>OPAC</div>
          <div style={{ fontSize:11, color:C.text3, marginTop:2, letterSpacing:'.08em', textTransform:'uppercase' }}>Online Public Access Catalog</div>
        </div>

        {mode === 'login' ? (
          <form onSubmit={doLogin}>
            <div style={{ fontSize:18, fontWeight:600, color:C.text, marginBottom:4 }}>Welcome back</div>
            <div style={{ fontSize:12, color:C.text3, marginBottom:22 }}>Sign in to continue to your library</div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontSize:11, padding:'8px 10px', borderRadius:6, marginBottom:12 }}>{error}</div>}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Email address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Password</label>
              <input style={inp} type="password" placeholder="Enter password" value={pass} onChange={e=>setPass(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:11, border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'#fff', background:C.navy, cursor:'pointer', marginTop:4, fontFamily:'inherit' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:C.text3 }}>
              Don't have an account?{' '}
              <span onClick={()=>{setMode('register');setError('');}} style={{ color:C.blue, cursor:'pointer', fontWeight:500 }}>Create one</span>
            </div>
            <div style={{ textAlign:'center', marginTop:6, fontSize:11, color:C.text3 }}>Admin? Use admin@opac.com / admin123</div>
          </form>
        ) : (
          <form onSubmit={doRegister}>
            <div style={{ fontSize:18, fontWeight:600, color:C.text, marginBottom:4 }}>Create new account</div>
            <div style={{ fontSize:12, color:C.text3, marginBottom:18 }}>
              Already registered?{' '}
              <span onClick={()=>{setMode('login');setError('');}} style={{ color:C.blue, cursor:'pointer' }}>Log in</span>
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', fontSize:11, padding:'8px 10px', borderRadius:6, marginBottom:12 }}>{error}</div>}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div><label style={lbl}>First name</label><input style={inp} placeholder="Juan" value={reg.fname} onChange={e=>setReg({...reg,fname:e.target.value})} required /></div>
              <div><label style={lbl}>Last name</label><input style={inp} placeholder="Dela Cruz" value={reg.lname} onChange={e=>setReg({...reg,lname:e.target.value})} /></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={lbl}>Email address</label><input style={inp} type="email" placeholder="you@example.com" value={reg.email} onChange={e=>setReg({...reg,email:e.target.value})} required /></div>
            <div style={{ marginBottom:14 }}><label style={lbl}>Password</label><input style={inp} type="password" placeholder="Create password" value={reg.password} onChange={e=>setReg({...reg,password:e.target.value})} required /></div>
            <div style={{ marginBottom:14 }}><label style={lbl}>Confirm password</label><input style={inp} type="password" placeholder="Repeat password" value={reg.password2} onChange={e=>setReg({...reg,password2:e.target.value})} required /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div><label style={lbl}>Student ID</label><input style={inp} placeholder="2024001" value={reg.student_id} onChange={e=>setReg({...reg,student_id:e.target.value})} /></div>
              <div><label style={lbl}>Year enrolled</label><input style={inp} placeholder="2024" value={reg.year} onChange={e=>setReg({...reg,year:e.target.value})} /></div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Course</label>
              <select style={{...inp, background:'#fff'}} value={reg.course} onChange={e=>setReg({...reg,course:e.target.value})} required>
                <option value="">Select course</option>
                {['BSIT','BTLE','BAT','BSA'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:11, border:'none', borderRadius:8, fontSize:13, fontWeight:600, color:'#fff', background:C.green, cursor:'pointer', fontFamily:'inherit' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <div style={{ textAlign:'center', marginTop:14, fontSize:12 }}>
              <span onClick={()=>{setMode('login');setError('');}} style={{ color:C.blue, cursor:'pointer' }}>← Back to login</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}