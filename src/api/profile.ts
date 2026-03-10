import { apiRequest } from './http';
import type { Role } from '../context/AuthContext';

export interface IndividualProfilePayload {
  fullName: string;
  phone: string;
  location: string;
  bio?: string | null;
}

export interface CompanyProfilePayload {
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  address: string;
  website?: string | null;
}

export async function fetchProfile(role: Role, token: string) {
  const path = role === 'COMPANY' ? '/profiles/company/me' : '/profiles/individual/me';
  return apiRequest(path, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function saveProfile(role: Role, token: string, payload: IndividualProfilePayload | CompanyProfilePayload) {
  const path = role === 'COMPANY' ? '/profiles/company' : '/profiles/individual';
  return apiRequest(path, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
}
