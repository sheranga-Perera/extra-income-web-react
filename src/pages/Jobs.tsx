import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createJob, fetchJobs, JobPostPayload, JobPostResponse } from '../api/jobs';
import { useAuth } from '../context/AuthContext';
import { fetchActiveAds, type ActiveAdResponse } from '../api/ads';

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
  contractDuration: ''
};

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

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPostResponse[]>([]);
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [form, setForm] = useState<JobFormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [ads, setAds] = useState<ActiveAdResponse[]>([]);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);

  const canCreate = user?.role === 'COMPANY' || user?.role === 'ADMIN';
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

  useEffect(() => {
    if (!user) {
      setJobs([]);
      return;
    }
    loadJobs(filters).catch(() => undefined);
  }, [user]);

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
      setFormError('Only company accounts can post jobs.');
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
      contractType: normalizeOptional(form.contractType)
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
          <p>Discover part-time opportunities and company postings.</p>
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
              placeholder="Search by title, company, or description"
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
            <input
              id="jobSector"
              placeholder="Private, Government, Startup..."
              value={filters.sector}
              onChange={(event) => setFilters((prev) => ({ ...prev, sector: event.target.value }))}
            />
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
            <input
              id="jobContractType"
              placeholder="Part-time, shift-based"
              value={filters.contractType}
              onChange={(event) => setFilters((prev) => ({ ...prev, contractType: event.target.value }))}
            />
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

      <div className="jobs-layout">
        <section className="jobs-feed">
          {error && <div className="notice notice--error">{error}</div>}
          {!loading && jobs.length === 0 && (
            <div className="panel jobs-empty">
              <h3>No matching jobs</h3>
              <p>Try adjusting your search filters.</p>
            </div>
          )}
          {jobs.map((job) => {
            const tags = [job.category, job.sector, job.location].filter(Boolean) as string[];
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
                </div>
                {tags.length > 0 && (
                  <div className="job-tags">
                    {tags.map((tag) => (
                      <span key={`${job.id}-${tag}`} className="job-tag">{tag}</span>
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
              <p>Company accounts can list open roles for job seekers.</p>
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
                  <input
                    id="jobSectorInput"
                    value={form.sector}
                    onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))}
                  />
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
                  <label htmlFor="jobContractType">Contract type</label>
                  <input
                    id="jobContractType"
                    value={form.contractType}
                    onChange={(event) => setForm((prev) => ({ ...prev, contractType: event.target.value }))}
                    placeholder="Part-time, shift-based"
                  />
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
                    {(ad.mediaContent || ad.mediaUrl) && (
                      <div className="ad-media">
                        {ad.adType.toLowerCase() === 'video' ? (
                          <video controls preload="metadata" src={ad.mediaContent ?? ad.mediaUrl ?? ''} />
                        ) : (
                          <img src={ad.mediaContent ?? ad.mediaUrl ?? ''} alt={ad.adTitle} />
                        )}
                      </div>
                    )}
                    <div className="ad-body">
                      <span className="ad-client">{ad.companyName}</span>
                      <h4>{ad.adTitle}</h4>
                      <p>{ad.adDescription}</p>
                      {ad.cta && (
                        <button className="button button--ghost" type="button">
                          {ad.cta}
                        </button>
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
