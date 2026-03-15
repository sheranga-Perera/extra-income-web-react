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

export async function fetchProfile(role: Role) {
  const path = role === 'COMPANY' ? '/profiles/company/me' : '/profiles/individual/me';
  return apiRequest(path);
}

export async function saveProfile(role: Role, payload: IndividualProfilePayload | CompanyProfilePayload) {
  const path = role === 'COMPANY' ? '/profiles/company' : '/profiles/individual';
  return apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
