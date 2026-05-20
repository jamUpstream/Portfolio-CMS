import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  if (options.auth) {
    const token = await getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path) => request(path),
  getAuth: (path) => request(path, { auth: true }),
  post: (path, body) => request(path, { method: 'POST', body, auth: true }),
  patch: (path, body) => request(path, { method: 'PATCH', body, auth: true }),
  delete: (path) => request(path, { method: 'DELETE', auth: true }),
  upload: (file, bucket) => {
    const body = new FormData();
    body.append('file', file);
    body.append('bucket', bucket);
    return request('/upload', { method: 'POST', body, auth: true });
  },
  importResume: (file) => {
    const body = new FormData();
    body.append('file', file);
    return request('/resume-import', { method: 'POST', body, auth: true });
  }
};
