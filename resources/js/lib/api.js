const BASE = '/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'API error');
  }
  return res.json();
}

export const booksApi = {
  list:   (p = {}) => request('/books?' + new URLSearchParams(p)),
  get:    (id)     => request(`/books/${id}`),
  create: (d)      => request('/books', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d)  => request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => request(`/books/${id}`, { method: 'DELETE' }),
};

export const authorsApi = {
  list:   (p = {}) => request('/authors?' + new URLSearchParams(p)),
  get:    (id)     => request(`/authors/${id}`),
  create: (d)      => request('/authors', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d)  => request(`/authors/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => request(`/authors/${id}`, { method: 'DELETE' }),
};

export const publishersApi = {
  list:   (p = {}) => request('/publishers?' + new URLSearchParams(p)),
  create: (d)      => request('/publishers', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d)  => request(`/publishers/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id)     => request(`/publishers/${id}`, { method: 'DELETE' }),
};

export const subjectsApi = {
  list:   ()    => request('/subjects'),
  create: (d)   => request('/subjects', { method: 'POST', body: JSON.stringify(d) }),
  delete: (id)  => request(`/subjects/${id}`, { method: 'DELETE' }),
};

export const seriesApi = {
  list:   ()    => request('/series'),
  create: (d)   => request('/series', { method: 'POST', body: JSON.stringify(d) }),
  delete: (id)  => request(`/series/${id}`, { method: 'DELETE' }),
};

export const copiesApi = {
  list:         (p = {}) => request('/copies?' + new URLSearchParams(p)),
  create:       (d)      => request('/copies', { method: 'POST', body: JSON.stringify(d) }),
  updateStatus: (id, st) => request(`/copies/${id}`, { method: 'PATCH', body: JSON.stringify({ status: st }) }),
  delete:       (id)     => request(`/copies/${id}`, { method: 'DELETE' }),
};

export const statsApi = { get: () => request('/stats') };
