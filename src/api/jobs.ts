import { apiRequest } from './http';

export interface JobPostPayload {
  title: string;
  description: string;
  category?: string;
  sector?: string;
  location?: string;
  hoursPerWeek?: number;
  hourlyRate?: number;
  contractType?: string;
  contractDuration: string;
}

export interface JobPostResponse extends JobPostPayload {
  id: string;
  companyName: string;
  status: string;
  createdAt: string;
}

export async function fetchJobs(params: {
  q?: string;
  category?: string;
  sector?: string;
  location?: string;
  contractType?: string;
  contractDuration?: string;
  minRate?: number | string;
  maxRate?: number | string;
} = {}): Promise<JobPostResponse[]> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.sector) query.set('sector', params.sector);
  if (params.location) query.set('location', params.location);
  if (params.contractType) query.set('contractType', params.contractType);
  if (params.contractDuration) query.set('contractDuration', params.contractDuration);
  if (params.minRate !== undefined) query.set('minRate', String(params.minRate));
  if (params.maxRate !== undefined) query.set('maxRate', String(params.maxRate));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/jobs${suffix}`);
}

export async function createJob(payload: JobPostPayload): Promise<JobPostResponse> {
  return apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
