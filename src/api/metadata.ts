import { apiRequest } from './http';

const DEFAULT_COMPANY_SECTORS = [
  'Agriculture',
  'Automotive',
  'Banking and finance',
  'Construction',
  'Education',
  'Food and beverage',
  'Government',
  'Healthcare',
  'Hospitality',
  'Information technology',
  'Logistics and transport',
  'Manufacturing',
  'Media and entertainment',
  'Non-profit',
  'Professional services',
  'Real estate',
  'Retail',
  'Security',
  'Telecommunications',
  'Tourism',
  'Other'
];

const DEFAULT_JOB_CONTRACT_TYPES = [
  'Part-time',
  'Full-time',
  'Contract',
  'Temporary',
  'Freelance',
  'Internship',
  'Shift-based',
  'Remote',
  'Hybrid',
  'On-site',
  'Other'
];

function toStringList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : Array.isArray((value as { data?: unknown })?.data)
      ? (value as { data: unknown[] }).data
      : [];

  return source
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object' && 'name' in item) {
        return String((item as { name: unknown }).name).trim();
      }
      return '';
    })
    .filter(Boolean);
}

export async function fetchCompanySectors(): Promise<string[]> {
  try {
    const sectors = toStringList(await apiRequest<unknown>('/metadata/company-sectors'));
    return sectors.length > 0 ? sectors : DEFAULT_COMPANY_SECTORS;
  } catch {
    return DEFAULT_COMPANY_SECTORS;
  }
}

export async function fetchJobContractTypes(): Promise<string[]> {
  try {
    const contractTypes = toStringList(await apiRequest<unknown>('/metadata/job-contract-types'));
    return contractTypes.length > 0 ? contractTypes : DEFAULT_JOB_CONTRACT_TYPES;
  } catch {
    return DEFAULT_JOB_CONTRACT_TYPES;
  }
}
