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

export interface RegisterPayload {
  username: string;
  password: string;
  confirmPassword: string;
  role: Role;
  identifierType: IdentifierType;
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  nicFront?: string;
  nicBack?: string;
  hasDriversLicense?: boolean;
  driversLicenseType?: string;
  profession?: string;
  preferredCategories?: string;
  preferredSectors?: string;
  skills?: string;
  companyName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  bio?: string;
  sector?: string;
  legalDocs?: string[];
}

export async function registerUser(payload: RegisterPayload): Promise<string> {
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
