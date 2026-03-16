import { apiRequest } from './http';

export interface IndividualSearchResponse {
  id: string;
  fullName: string;
  location: string;
  profession: string;
  skills: string;
  preferredCategories: string;
  preferredSectors: string;
  bio: string;
  phone: string;
  email: string;
}

export async function searchIndividuals(params: {
  skills?: string;
  location?: string;
  profession?: string;
} = {}): Promise<IndividualSearchResponse[]> {
  const query = new URLSearchParams();
  if (params.skills) query.set('skills', params.skills);
  if (params.location) query.set('location', params.location);
  if (params.profession) query.set('profession', params.profession);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest(`/hire/individuals${suffix}`);
}
