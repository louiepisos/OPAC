import React, { useState } from 'react';
import CatalogPage    from './pages/CatalogPage';
import BookDetailPage from './pages/BookDetailPage';
import AuthorsPage    from './pages/AuthorsPage';
import SubjectsPage   from './pages/SubjectsPage';
import Header         from './components/Header';

export default function App() {
  const [view, setView]     = useState('catalog');
  const [selected, setBook] = useState(null);

  function openBook(book) { setBook(book); setView('book'); }
  function goBack()        { setView('catalog'); setBook(null); }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f4ec', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Header view={view} setView={setView} goBack={goBack} />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {view === 'catalog'  && <CatalogPage    onSelectBook={openBook} />}
        {view === 'book'     && <BookDetailPage book={selected} onBack={goBack} />}
        {view === 'authors'  && <AuthorsPage />}
        {view === 'subjects' && <SubjectsPage   onSelectBook={openBook} />}
      </main>
      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '.8rem', color: '#8a7f72', borderTop: '1px solid #ddd6c8' }}>
        OPAC Â· Online Public Access Catalog Â· Laravel + React + PostgreSQL
      </footer>
    </div>
  );
}