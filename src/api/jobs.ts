import { apiRequest } from './http';

export type CvRequirement = 'REQUIRED' | 'OPTIONAL' | 'NOT_REQUIRED';

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
  cvRequirement?: CvRequirement;
}

export interface JobPostResponse extends JobPostPayload {
  id: string;
  companyName: string;
  status: string;
  createdAt: string;
  applied?: boolean;
}

export interface JobApplicationResponse {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  cvUploaded: boolean;
}

export interface JobApplicantResponse {
  applicationId: string;
  jobId: string;
  individualUserId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  profession?: string | null;
  skills?: string | null;
  status: string;
  appliedAt: string;
  cvUploaded: boolean;
  cvDocument?: string | null;
}

export interface AppliedJobResponse {
  applicationId: string;
  status: string;
  appliedAt: string;
  cvUploaded: boolean;
  job: JobPostResponse;
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

export async function applyForJob(jobId: string, payload: { cvDocument?: string } = {}): Promise<JobApplicationResponse> {
  return apiRequest(`/jobs/${jobId}/applications`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function fetchJobApplicants(jobId: string): Promise<JobApplicantResponse[]> {
  return apiRequest(`/jobs/${jobId}/applications`);
}

export async function fetchMyJobApplications(): Promise<AppliedJobResponse[]> {
  return apiRequest('/jobs/applications/me');
}
