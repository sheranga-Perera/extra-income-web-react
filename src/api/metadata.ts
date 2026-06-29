import { apiRequest } from './http';

export async function fetchCompanySectors(): Promise<string[]> {
  return apiRequest<string[]>('/metadata/company-sectors');
}

export async function fetchJobContractTypes(): Promise<string[]> {
  return apiRequest<string[]>('/metadata/job-contract-types');
}
