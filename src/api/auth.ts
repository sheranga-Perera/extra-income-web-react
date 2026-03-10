import { apiRequest } from './http';
import type { IdentifierType, Role, UserSummary } from '../context/AuthContext';

interface AuthResponse {
  token: string;
}

export async function loginUser(username: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return response.token;
}

export async function registerUser(payload: {
  username: string;
  password: string;
  role: Role;
  identifierType: IdentifierType;
}): Promise<string> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return response.token;
}

export async function fetchCurrentUser(token: string): Promise<UserSummary> {
  return apiRequest<UserSummary>('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
