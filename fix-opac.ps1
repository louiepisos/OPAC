# fix-opac.ps1
# Fixes: 1) PHP namespace error on register
#        2) Broken emoji icons in sidebar
#        3) White edges / non-flexible layout
# Run from: C:\laragon\www\opac-app
# powershell -ExecutionPolicy Bypass -File fix-opac.ps1

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
function W($path, $content) {
    $full = Join-Path (Get-Location) $path
    New-Item -ItemType Directory -Force -Path (Split-Path $full) | Out-Null
    # Trim leading newlines so <?php is always first character
    $trimmed = $content.TrimStart("`r`n ")
    [System.IO.File]::WriteAllText($full, $trimmed, $utf8NoBom)
    Write-Host "  FIXED: $path" -ForegroundColor Green
}

Write-Host "Applying fixes..." -ForegroundColor Cyan

# ── FIX 1: AuthController — trim leading whitespace so <?php is first ──────
W "app\Http\Controllers\Api\AuthController.php" @'
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($request->email === config('opac.admin_email', 'admin@opac.com') &&
            $request->password === config('opac.admin_password', 'admin123')) {
            return response()->json([
                'role'  => 'admin',
                'name'  => 'Librarian Admin',
                'email' => $request->email,
            ]);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json([
            'role'   => $user->role ?? 'student',
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'course' => $user->course ?? null,
            'year'   => $user->year   ?? null,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => 'required|string|min:6',
            'student_id' => 'nullable|string',
            'course'     => 'nullable|string',
            'year'       => 'nullable|string',
        ]);

        $user = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'role'       => 'student',
            'course'     => $request->course,
            'year'       => $request->year,
            'student_id' => $request->student_id,
        ]);

        return response()->json([
            'role'   => 'student',
            'id'     => $user->id,
            'name'   => $user->name,
            'email'  => $user->email,
            'course' => $user->course,
            'year'   => $user->year,
        ], 201);
    }
}
'@

# ── FIX 2: UserController ───────────────────────────────────────────────────
W "app\Http\Controllers\Api\UserController.php" @'
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::query();
        if ($s = $request->query('q')) {
            $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%");
        }
        return response()->json($q->orderBy('name')->paginate($request->query('per_page', 50)));
    }

    public function destroy(int $id): JsonResponse
    {
        User::findOrFail($id)->delete();
        return response()->json(['message' => 'User deleted.']);
    }
}
'@

# ── FIX 3: Blade template — full-height CSS reset + DM Sans font ────────────
W "resources\views\app.blade.php" @'
<!DOCTYPE html>
<html lang="en" style="height:100%;margin:0;padding:0">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>OPAC</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; width: 100%; overflow: hidden; font-family: 'DM Sans', sans-serif; }
    #app { height: 100%; width: 100%; display: flex; flex-direction: column; }
  </style>
  @viteReactRefresh
  @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
  <div id="app"></div>
</body>
</html>
'@

# ── FIX 4: AdminShell — SVG icons (no emoji) + full-width layout ────────────
W "resources\js\pages\admin\AdminShell.jsx" @'
import React, { useState } from 'react';
import AdminHome      from './AdminHome';
import AdminDashboard from './AdminDashboard';
import AdminBooks     from './AdminBooks';
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
  { id:'students',  label:'Manage Students', section:''        },
];
const TITLES = {
  home:'Admin Home', dashboard:'Dashboard',
  books:'Manage Books', students:'Manage Students',
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
          {page === 'students'  && <AdminStudents />}
        </div>
      </div>
    </div>
  );
}
'@

# ── FIX 5: UserShell — full-height flex layout ───────────────────────────────
W "resources\js\pages\user\UserShell.jsx" @'
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
'@

# ── FIX 6: app.jsx — full-height root ───────────────────────────────────────
W "resources\js\app.jsx" @'
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import LoginPage  from './pages/LoginPage';
import AdminShell from './pages/admin/AdminShell';
import UserShell  from './pages/user/UserShell';

function App() {
  const [auth, setAuth] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('opac_auth') || 'null'); }
    catch { return null; }
  });

  function login(data) {
    sessionStorage.setItem('opac_auth', JSON.stringify(data));
    setAuth(data);
  }
  function logout() {
    sessionStorage.removeItem('opac_auth');
    setAuth(null);
  }

  if (!auth)                 return <LoginPage  onLogin={login} />;
  if (auth.role === 'admin') return <AdminShell user={auth} onLogout={logout} />;
  return                            <UserShell  user={auth} onLogout={logout} />;
}

const el = document.getElementById('app');
if (el) ReactDOM.createRoot(el).render(<React.StrictMode><App /></React.StrictMode>);
'@

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All fixes applied!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  php artisan config:clear" -ForegroundColor White
Write-Host "  php artisan cache:clear" -ForegroundColor White
Write-Host "  php artisan route:clear" -ForegroundColor White
Write-Host ""
Write-Host "Restart php artisan serve, keep npm run dev running." -ForegroundColor Cyan
Write-Host "Then refresh http://localhost:8000" -ForegroundColor Cyan