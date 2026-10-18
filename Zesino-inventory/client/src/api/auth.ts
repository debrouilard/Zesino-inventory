import type { AuthUser } from '../types/reports';
import { api, setToken } from './http';

export async function login(email: string, password: string) {
  const result = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(result.token);
  return result.user;
}

export function fetchMe() {
  return api<AuthUser>('/api/auth/me');
}

export function logout() {
  setToken(null);
}
