const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/api${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string; role: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    register: (body: { name: string; email: string; password: string; role: string }) =>
      apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    logout: () =>
      apiRequest('/auth/logout', { method: 'POST' }),

    me: () =>
      apiRequest('/auth/me'),
  },
};
