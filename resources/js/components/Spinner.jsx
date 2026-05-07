import React from 'react';

export default function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid #e8e0d0',
        borderTop: '3px solid #c9922d',
        animation: 'spin 1s linear infinite',
      }} />
    </div>
  );
}