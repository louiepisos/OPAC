import '../css/app.css';
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
if (el) {
  const root = ReactDOM.createRoot(el);
  root.render(<React.StrictMode><App /></React.StrictMode>);
  
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      // Cleanup on HMR
    });
  }
}