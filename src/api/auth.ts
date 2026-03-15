import { apiRequest } from './http';
import type { IdentifierType, Role, UserSummary } from '../context/AuthContext';

interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  data?: {
    token?: string;
    accessToken?: string;
    jwt?: string;
  };
}

function extractToken(response: AuthResponse): string {
  const token =
    response.token ||
    response.accessToken ||
    response.jwt ||
    response.data?.token ||
    response.data?.accessToken ||
    response.data?.jwt;

  if (!token) {
    throw new Error('Token missing in auth response');
  }

  return token;
}

export async function loginUser(username: string, password: string): Promise<string> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return extractToken(response);
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
  return extractToken(response);
}

export async function fetchCurrentUser(token: string): Promise<UserSummary> {
  return apiRequest<UserSummary>('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
