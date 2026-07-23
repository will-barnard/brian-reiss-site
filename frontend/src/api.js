// Thin fetch wrapper. Admin token lives in memory + localStorage.
const TOKEN_KEY = 'br_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function handle(res) {
  if (res.status === 401) {
    setToken('');
  }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export function apiGet(path) {
  return fetch(`/api${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(handle);
}

export function apiSend(method, path, body) {
  return fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(handle);
}

export function apiUpload(path, file) {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  }).then(handle);
}

export function imageUrl(id) {
  return id ? `/api/images/${id}` : null;
}
