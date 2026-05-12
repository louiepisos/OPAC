const BASE = '/api/v1';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...opts,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || res.statusText };
  }
  if (!res.ok) {
    const validation = data.errors
      ? Object.values(data.errors).flat().join(' ')
      : '';
    throw new Error(validation || data.message || res.statusText);
  }
  return data;
}

export const booksApi = {
  list:   (p = {}) => req('/books?' + new URLSearchParams(p)),
  get:    (id)     => req(`/books/${id}`),
  create: (d)      => req('/books',  { method: 'POST',   body: JSON.stringify(d) }),
  update: (id, d)  => req(`/books/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => req(`/books/${id}`, { method: 'DELETE' }),
  returnCopy: (id) => req(`/books/${id}/return-copy`, { method: 'POST' }),
};
export const authorsApi = {
  list:   (p = {}) => req('/authors?' + new URLSearchParams(p)),
  get:    (id)     => req(`/authors/${id}`),
  create: (d)      => req('/authors', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d)  => req(`/authors/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => req(`/authors/${id}`, { method: 'DELETE' }),
};
export const publishersApi = {
  list:   (p = {}) => req('/publishers?' + new URLSearchParams(p)),
  create: (d)      => req('/publishers', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d)  => req(`/publishers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => req(`/publishers/${id}`, { method: 'DELETE' }),
};
export const subjectsApi = {
  list: () => req('/subjects'),
};
export const isbnApi = {
  lookup: (isbn) => req(`/isbn/${encodeURIComponent(isbn)}`),
};
export const printSlipsApi = {
  list:   (p = {}) => req('/print-transactions?' + new URLSearchParams(p)),
  create: (bookId, d) => req(`/books/${bookId}/print-slip`, { method: 'POST', body: JSON.stringify(d) }),
};
export const statsApi = {
  get: () => req('/stats'),
};
export const usersApi = {
  list:   (p = {}) => req('/users?' + new URLSearchParams(p)),
  create: (d)      => req('/users', { method: 'POST', body: JSON.stringify(d) }),
  delete: (id)     => req(`/users/${id}`, { method: 'DELETE' }),
};
export const authApi = {
  login:    (d) => req('/auth/login',    { method: 'POST', body: JSON.stringify(d) }),
  register: (d) => req('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
};
