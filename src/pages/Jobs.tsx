import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AppliedJobResponse,
  applyForJob,
  createJob,
  CvRequirement,
  fetchJobApplicants,
  fetchJobs,
  fetchMyJobApplications,
  JobApplicantResponse,
  JobPostPayload,
  JobPostResponse
} from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { fetchActiveAds, type ActiveAdResponse } from '../api/ads';
import { fetchCompanySectors, fetchJobContractTypes } from '../api/metadata';

interface JobFilters {
  q: string;
  category: string;
  sector: string;
  location: string;
  contractType: string;
  contractDuration: string;
  minRate: string;
  maxRate: string;
}

interface JobFormState {
  title: string;
  description: string;
  category: string;
  sector: string;
  location: string;
  hoursPerWeek: string;
  hourlyRate: string;
  contractType: string;
  contractDuration: string;
  cvRequirement: CvRequirement;
}

const initialFilters: JobFilters = {
  q: '',
  category: '',
  sector: '',
  location: '',
  contractType: '',
  contractDuration: '',
  minRate: '',
  maxRate: ''
};

const initialForm: JobFormState = {
  title: '',
  description: '',
  category: '',
  sector: '',
  location: '',
  hoursPerWeek: '',
  hourlyRate: '',
  contractType: '',
  contractDuration: '',
  cvRequirement: 'NOT_REQUIRED'
};

const cvRequirementLabels: Record<CvRequirement, string> = {
  REQUIRED: 'Required',
  OPTIONAL: 'Optional',
  NOT_REQUIRED: 'Not Required'
};

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  reader.readAsDataURL(file);
});

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'Not set';
  }
  return `LKR ${Number(value).toLocaleString('en-LK')}`;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const normalizeOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parsePositiveNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
};

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const normalizeMediaUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
};

const getAdMediaSource = (ad: ActiveAdResponse) => {
  const uploadedMedia = ad.mediaContent?.trim();
  if (uploadedMedia) {
    return uploadedMedia;
  }
  return normalizeMediaUrl(ad.mediaUrl) || '';
};

const isVideoAd = (ad: ActiveAdResponse) => {
  const source = getAdMediaSource(ad).toLowerCase();
  if (source.startsWith('data:image/')) {
    return false;
  }
  if (source.startsWith('data:video/')) {
    return true;
  }
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|#|$)/i.test(source)) {
    return false;
  }
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(source)) {
    return true;
  }
  return ad.adType.toLowerCase().includes('video');
};

const normalizeExternalUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPostResponse[]>([]);
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [form, setForm] = useState<JobFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [applicationNotice, setApplicationNotice] = useState<string | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [applicationCvFiles, setApplicationCvFiles] = useState<Record<string, File | null>>({});
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobResponse[]>([]);
  const [appliedJobsLoading, setAppliedJobsLoading] = useState(false);
  const [appliedJobsError, setAppliedJobsError] = useState<string | null>(null);
  const [applicantsByJobId, setApplicantsByJobId] = useState<Record<string, JobApplicantResponse[]>>({});
  const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState<string | null>(null);
  const [applicantsLoadingJobId, setApplicantsLoadingJobId] = useState<string | null>(null);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  const [ads, setAds] = useState<ActiveAdResponse[]>([]);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [companySectors, setCompanySectors] = useState<string[]>([]);

  const canCreate = user?.role === 'COMPANY' || user?.role === 'ADMIN';
  const canViewApplicants = user?.role === 'COMPANY';
  const canApply = user?.role === 'INDIVIDUAL';
  const showAds = user?.role === 'INDIVIDUAL';

  const loadJobs = async (nextFilters: JobFilters) => {
    setLoading(true);
    setError(null);
    try {
      const minRate = parseOptionalNumber(nextFilters.minRate);
      const maxRate = parseOptionalNumber(nextFilters.maxRate);
      const data = await fetchJobs({
        q: nextFilters.q.trim() || undefined,
        category: nextFilters.category.trim() || undefined,
        sector: nextFilters.sector.trim() || undefined,
        location: nextFilters.location.trim() || undefined,
        contractType: nextFilters.contractType.trim() || undefined,
        contractDuration: nextFilters.contractDuration.trim() || undefined,
        minRate,
        maxRate
      });
      setJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load jobs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    if (!canApply) {
      setAppliedJobs([]);
      return;
    }

    setAppliedJobsLoading(true);
    setAppliedJobsError(null);
    try {
      const data = await fetchMyJobApplications();
      setAppliedJobs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applied jobs.';
      setAppliedJobsError(message);
    } finally {
      setAppliedJobsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setJobs([]);
      return;
    }
    loadJobs(filters).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!user || !canApply) {
      setAppliedJobs([]);
      return;
    }
    loadMyApplications().catch(() => undefined);
  }, [user, canApply]);

  useEffect(() => {
    Promise.all([fetchJobContractTypes(), fetchCompanySectors()])
      .then(([contractTypeData, sectorData]) => {
        setContractTypes(contractTypeData);
        setCompanySectors(sectorData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job metadata.'));
  }, []);

  useEffect(() => {
    if (!user || !showAds) {
      setAds([]);
      return;
    }
    setAdsLoading(true);
    setAdsError(null);
    fetchActiveAds()
      .then((data) => setAds(data))
      .catch((err) => {
        setAdsError(err instanceof Error ? err.message : 'Failed to load ads.');
      })
      .finally(() => setAdsLoading(false));
  }, [user, showAds]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    loadJobs(filters).catch(() => undefined);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    if (!user) {
      return;
    }
    loadJobs(initialFilters).catch(() => undefined);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!user) {
      setFormError('Login required to create a job.');
      return;
    }

    if (!canCreate) {
      setFormError('Only job provider accounts can post jobs.');
      return;
    }

    const hours = parsePositiveNumber(form.hoursPerWeek);
    const rate = parsePositiveNumber(form.hourlyRate);

    if (!form.title.trim() || !form.description.trim() || !form.contractDuration.trim()) {
      setFormError('Title, description, and contract duration are required.');
      return;
    }
    if (hours === null || rate === null) {
      setFormError('Hours per week and hourly rate must be positive numbers.');
      return;
    }

    const payload: JobPostPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      contractDuration: form.contractDuration.trim(),
      hoursPerWeek: hours,
      hourlyRate: rate,
      category: normalizeOptional(form.category),
      sector: normalizeOptional(form.sector),
      location: normalizeOptional(form.location),
      contractType: normalizeOptional(form.contractType),
      cvRequirement: form.cvRequirement
    };

    try {
      await createJob(payload);
      setForm(initialForm);
      setFormSuccess('Job posted successfully.');
      await loadJobs(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job post.';
      setFormError(message);
    }
  };

  const handleApply = async (job: JobPostResponse) => {
    if (!user) {
      setError('Login required to apply for jobs.');
      return;
    }
    if (!canApply) {
      setError('Only individual accounts can apply for jobs.');
      return;
    }

    setError(null);
    setApplicationNotice(null);
    setApplyingJobId(job.id);
    try {
      const cvRequirement = job.cvRequirement ?? 'NOT_REQUIRED';
      const cvFile = applicationCvFiles[job.id] ?? null;
      if (cvRequirement === 'REQUIRED' && !cvFile) {
        setError('Upload your CV before applying for this job.');
        return;
      }

      const cvDocument = cvFile ? await readFileAsDataUrl(cvFile) : undefined;
      await applyForJob(job.id, { cvDocument });
      setJobs((prev) => prev.map((existingJob) => (
        existingJob.id === job.id ? { ...existingJob, applied: true } : existingJob
      )));
      setApplicationCvFiles((prev) => ({ ...prev, [job.id]: null }));
      setApplicationNotice('Application submitted.');
      await loadMyApplications();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply for job.';
      setError(message);
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleToggleApplicants = async (jobId: string) => {
    if (!canViewApplicants) {
      return;
    }
    setApplicantsError(null);
    if (expandedApplicantsJobId === jobId) {
      setExpandedApplicantsJobId(null);
      return;
    }

    setExpandedApplicantsJobId(jobId);
    if (applicantsByJobId[jobId]) {
      return;
    }

    setApplicantsLoadingJobId(jobId);
    try {
      const data = await fetchJobApplicants(jobId);
      setApplicantsByJobId((prev) => ({ ...prev, [jobId]: data }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load applicants.';
      setApplicantsError(message);
    } finally {
      setApplicantsLoadingJobId(null);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="panel">
          <h2>Job Feed</h2>
          <p>Login is required to browse job posts.</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="button" to="/login">Login</Link>
            <Link className="button button--ghost" to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="jobs-header">
        <div>
          <h2>Job Feed</h2>
          <p>Discover part-time opportunities and job provider postings.</p>
        </div>
        <div className="jobs-summary">
          {loading ? 'Loading jobs...' : `${jobs.length} open roles`}
        </div>
      </div>

      <form className="panel jobs-search" onSubmit={handleSearch}>
        <div className="jobs-search__fields">
          <div className="field">
            <label htmlFor="jobQuery">Search</label>
            <input
              id="jobQuery"
              placeholder="Search by title, job provider, or description"
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="jobCategory">Category</label>
            <input
              id="jobCategory"
              placeholder="Education, Food, Transport..."
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="jobSector">Sector</label>
            <select
              id="jobSector"
              value={filters.sector}
              onChange={(event) => setFilters((prev) => ({ ...prev, sector: event.target.value }))}
            >
              <option value="">All sectors</option>
              {companySectors.map((sector) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jobLocation">Location</label>
            <input
              id="jobLocation"
              placeholder="Colombo, Kandy, Galle"
              value={filters.location}
              onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="jobContractType">Contract type</label>
            <select
              id="jobContractType"
              value={filters.contractType}
              onChange={(event) => setFilters((prev) => ({ ...prev, contractType: event.target.value }))}
            >
              <option value="">All contract types</option>
              {contractTypes.map((contractType) => (
                <option key={contractType} value={contractType}>{contractType}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="jobContractDuration">Contract duration</label>
            <input
              id="jobContractDuration"
              placeholder="3 months"
              value={filters.contractDuration}
              onChange={(event) => setFilters((prev) => ({ ...prev, contractDuration: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="jobMinRate">Hourly rate min (LKR)</label>
            <input
              id="jobMinRate"
              type="number"
              min="0"
              step="1"
              value={filters.minRate}
              onChange={(event) => setFilters((prev) => ({ ...prev, minRate: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="jobMaxRate">Hourly rate max (LKR)</label>
            <input
              id="jobMaxRate"
              type="number"
              min="0"
              step="1"
              value={filters.maxRate}
              onChange={(event) => setFilters((prev) => ({ ...prev, maxRate: event.target.value }))}
            />
          </div>
        </div>
        <div className="jobs-search__actions">
          <button className="button" type="submit">Search</button>
          <button className="button button--ghost" type="button" onClick={handleClear}>Clear</button>
        </div>
      </form>

      {canApply && (
        <section className="panel applications-panel">
          <div className="applications-panel__header">
            <div>
              <h3>My applications</h3>
              <p>Jobs you have already applied for.</p>
            </div>
            <span className="jobs-summary">
              {appliedJobsLoading ? 'Loading...' : `${appliedJobs.length} applications`}
            </span>
          </div>
          {appliedJobsError && <div className="notice notice--error">{appliedJobsError}</div>}
          {!appliedJobsLoading && appliedJobs.length === 0 && !appliedJobsError && (
            <div className="notice">You have not applied for any jobs yet.</div>
          )}
          {appliedJobs.length > 0 && (
            <div className="applications-list">
              {appliedJobs.map((application) => (
                <article key={application.applicationId} className="application-row">
                  <div>
                    <h4>{application.job.title}</h4>
                    <p>{application.job.companyName}</p>
                  </div>
                  <div>
                    <span className="job-meta__label">Applied</span>
                    <span>{formatDate(application.appliedAt)}</span>
                  </div>
                  <div>
                    <span className="job-meta__label">Status</span>
                    <span>{application.status}</span>
                  </div>
                  <div>
                    <span className="job-meta__label">CV</span>
                    <span>{application.cvUploaded ? 'Uploaded' : 'Not uploaded'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="jobs-layout">
        <section className="jobs-feed">
          {error && <div className="notice notice--error">{error}</div>}
          {applicationNotice && <div className="notice">{applicationNotice}</div>}
          {!loading && jobs.length === 0 && (
            <div className="panel jobs-empty">
              <h3>No matching jobs</h3>
              <p>Try adjusting your search filters.</p>
            </div>
          )}
          {jobs.map((job) => {
            const tags = [job.category, job.sector, job.location].filter(Boolean) as string[];
            const isApplied = Boolean(job.applied);
            const isApplying = applyingJobId === job.id;
            const cvRequirement = job.cvRequirement ?? 'NOT_REQUIRED';
            const showCvUpload = canApply && cvRequirement !== 'NOT_REQUIRED' && !isApplied;
            return (
              <article key={job.id} className="job-card">
                <div className="job-card__header">
                  <div>
                    <h3>{job.title}</h3>
                    <p className="job-company">{job.companyName}</p>
                  </div>
                  <span className="job-date">{formatDate(job.createdAt)}</span>
                </div>
                <p className="job-description">{job.description}</p>
                <div className="job-meta">
                  <div>
                    <span className="job-meta__label">Hours per week</span>
                    <span>{job.hoursPerWeek ?? 'Not set'}</span>
                  </div>
                  <div>
                    <span className="job-meta__label">Hourly rate</span>
                    <span>{formatMoney(job.hourlyRate)}</span>
                  </div>
                  <div>
                    <span className="job-meta__label">Contract</span>
                    <span>
                      {job.contractType ? `${job.contractType} • ` : ''}
                      {job.contractDuration}
                    </span>
                  </div>
                  <div>
                    <span className="job-meta__label">CV</span>
                    <span>{cvRequirementLabels[cvRequirement]}</span>
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="job-tags">
                    {tags.map((tag) => (
                      <span key={`${job.id}-${tag}`} className="job-tag">{tag}</span>
                    ))}
                  </div>
                )}
                {canApply && (
                  <div className="job-card__actions">
                    {showCvUpload && (
                      <div className="field job-card__cv-field">
                        <label htmlFor={`job-cv-${job.id}`}>
                          CV {cvRequirement === 'REQUIRED' ? '(required)' : '(optional)'}
                        </label>
                        <input
                          id={`job-cv-${job.id}`}
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            setApplicationCvFiles((prev) => ({ ...prev, [job.id]: file }));
                          }}
                        />
                      </div>
                    )}
                    <button
                      className="button"
                      type="button"
                      disabled={isApplied || isApplying}
                      onClick={() => handleApply(job)}
                    >
                      {isApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                )}
                {canViewApplicants && (
                  <div className="job-card__actions">
                    <button
                      className="button button--ghost"
                      type="button"
                      disabled={applicantsLoadingJobId === job.id}
                      onClick={() => handleToggleApplicants(job.id)}
                    >
                      {applicantsLoadingJobId === job.id
                        ? 'Loading applicants...'
                        : expandedApplicantsJobId === job.id
                          ? 'Hide applicants'
                          : 'View applicants'}
                    </button>
                  </div>
                )}
                {canViewApplicants && expandedApplicantsJobId === job.id && (
                  <div className="applicants-panel">
                    {applicantsError && <div className="notice notice--error">{applicantsError}</div>}
                    {applicantsLoadingJobId === job.id && <div className="notice">Loading applicants...</div>}
                    {applicantsByJobId[job.id]?.length === 0 && applicantsLoadingJobId !== job.id && (
                      <div className="notice">No applicants yet.</div>
                    )}
                    {applicantsByJobId[job.id]?.map((applicant) => (
                      <article key={applicant.applicationId} className="applicant-card">
                        <div className="applicant-card__header">
                          <div>
                            <h4>{applicant.fullName || 'Unnamed applicant'}</h4>
                            <p>{applicant.profession || 'Profession not specified'}</p>
                          </div>
                          <span className="job-date">{formatDate(applicant.appliedAt)}</span>
                        </div>
                        <div className="job-meta">
                          <div>
                            <span className="job-meta__label">Phone</span>
                            <span>{applicant.phone || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="job-meta__label">Email</span>
                            <span>{applicant.email || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="job-meta__label">Location</span>
                            <span>{applicant.location || 'Not provided'}</span>
                          </div>
                        </div>
                        {applicant.skills && (
                          <div className="job-tags">
                            {applicant.skills.split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                              <span key={`${applicant.applicationId}-${skill}`} className="job-tag">{skill}</span>
                            ))}
                          </div>
                        )}
                        <div className="job-card__actions">
                          {applicant.cvUploaded && applicant.cvDocument ? (
                            <a
                              className="button button--ghost"
                              href={applicant.cvDocument}
                              target="_blank"
                              rel="noreferrer"
                              download
                            >
                              View CV
                            </a>
                          ) : (
                            <span className="job-date">No CV uploaded</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {canCreate && (
          <aside className="jobs-sidebar">
            <div className="panel">
              <h3>Post a job</h3>
              <p>Job provider accounts can list open roles for job seekers.</p>
              {formError && <div className="notice notice--error">{formError}</div>}
              {formSuccess && <div className="notice">{formSuccess}</div>}
              <form className="jobs-form" onSubmit={handleCreate}>
                <div className="field">
                  <label htmlFor="jobTitle">Job title</label>
                  <input
                    id="jobTitle"
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Part-time barista"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobDescription">Description</label>
                  <textarea
                    id="jobDescription"
                    rows={4}
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe responsibilities, shift times, and requirements"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobCategoryInput">Category</label>
                  <input
                    id="jobCategoryInput"
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobSectorInput">Sector</label>
                  <select
                    id="jobSectorInput"
                    value={form.sector}
                    onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))}
                  >
                    <option value="">{companySectors.length > 0 ? 'Select sector' : 'Loading sectors...'}</option>
                    {form.sector && !companySectors.includes(form.sector) && (
                      <option value={form.sector}>{form.sector}</option>
                    )}
                    {companySectors.map((sector) => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="jobLocationInput">Location</label>
                  <input
                    id="jobLocationInput"
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobHours">Hours per week</label>
                  <input
                    id="jobHours"
                    type="number"
                    min="1"
                    step="1"
                    value={form.hoursPerWeek}
                    onChange={(event) => setForm((prev) => ({ ...prev, hoursPerWeek: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobRate">Hourly rate (LKR)</label>
                  <input
                    id="jobRate"
                    type="number"
                    min="1"
                    step="1"
                    value={form.hourlyRate}
                    onChange={(event) => setForm((prev) => ({ ...prev, hourlyRate: event.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobContractTypeInput">Contract type</label>
                  <select
                    id="jobContractTypeInput"
                    value={form.contractType}
                    onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}
                  >
                    <option value="">{contractTypes.length > 0 ? 'Select contract type' : 'Loading contract types...'}</option>
                    {form.contractType && !contractTypes.includes(form.contractType) && (
                      <option value={form.contractType}>{form.contractType}</option>
                    )}
                    {contractTypes.map((contractType) => (
                      <option key={contractType} value={contractType}>{contractType}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="jobContractDuration">Contract duration</label>
                  <input
                    id="jobContractDuration"
                    value={form.contractDuration}
                    onChange={(event) => setForm((prev) => ({ ...prev, contractDuration: event.target.value }))}
                    placeholder="3 months"
                  />
                </div>
                <div className="field">
                  <label htmlFor="jobCvRequirement">CV requirement</label>
                  <select
                    id="jobCvRequirement"
                    value={form.cvRequirement}
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      cvRequirement: event.target.value as CvRequirement
                    }))}
                  >
                    <option value="REQUIRED">Required</option>
                    <option value="OPTIONAL">Optional</option>
                    <option value="NOT_REQUIRED">Not Required</option>
                  </select>
                </div>
                <button className="button" type="submit">Publish Job</button>
              </form>
            </div>
          </aside>
        )}
        {showAds && (
          <aside className="jobs-sidebar">
            <div className="panel ads-panel">
              <div className="ads-panel__header">
                <div>
                  <h3>Paid Advertisements</h3>
                  <p>Sponsored offers selected for job seekers.</p>
                </div>
                <span className="ad-badge">Sponsored</span>
              </div>
              <div className="ads-list">
                {adsLoading && <div className="notice">Loading ads...</div>}
                {adsError && <div className="notice notice--error">{adsError}</div>}
                {!adsLoading && ads.length === 0 && !adsError && (
                  <div className="notice">No sponsored ads available yet.</div>
                )}
                {ads.map((ad) => (
                  <article key={ad.id} className="ad-card">
                    {getAdMediaSource(ad) && (
                      <div className="ad-media">
                        {isVideoAd(ad) ? (
                          <video
                            controls
                            preload="metadata"
                            src={getAdMediaSource(ad)}
                            onError={(event) => {
                              event.currentTarget.closest('.ad-media')?.classList.add('ad-media--empty');
                            }}
                          />
                        ) : (
                          <img
                            src={getAdMediaSource(ad)}
                            alt={ad.adTitle}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.closest('.ad-media')?.classList.add('ad-media--empty');
                            }}
                          />
                        )}
                        <span className="ad-media__fallback">Media unavailable</span>
                      </div>
                    )}
                    <div className="ad-body">
                      <span className="ad-client">{ad.companyName}</span>
                      <h4>{ad.adTitle}</h4>
                      <p>{ad.adDescription}</p>
                      {ad.cta && normalizeExternalUrl(ad.ctaUrl) && (
                        <a
                          className="button button--ghost"
                          href={normalizeExternalUrl(ad.ctaUrl) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ad.cta}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              <div className="notice">
                Companies can submit paid ads from the Advertise page and confirm payment via WhatsApp.
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
