import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchIndividuals, IndividualSearchResponse } from '../api/hire';
import { useAuth } from '../context/AuthContext';

interface HireFilters {
  skills: string;
  location: string;
  profession: string;
}

const initialFilters: HireFilters = {
  skills: '',
  location: '',
  profession: ''
};

const formatSkills = (skills?: string | null) => {
  if (!skills) {
    return [] as string[];
  }
  return skills.split(',').map((skill) => skill.trim()).filter(Boolean);
};

export default function Hire() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<HireFilters>(initialFilters);
  const [results, setResults] = useState<IndividualSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canHire = user?.role === 'COMPANY';

  const loadResults = async (nextFilters: HireFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchIndividuals({
        skills: nextFilters.skills.trim() || undefined,
        location: nextFilters.location.trim() || undefined,
        profession: nextFilters.profession.trim() || undefined
      });
      setResults(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load candidates.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !canHire) {
      setResults([]);
      return;
    }
    loadResults(filters).catch(() => undefined);
  }, [user, canHire]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!user || !canHire) {
      return;
    }
    loadResults(filters).catch(() => undefined);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    if (!user || !canHire) {
      return;
    }
    loadResults(initialFilters).catch(() => undefined);
  };

  if (!user) {
    return (
      <div className="container">
        <div className="panel">
          <h2>Hire Talent</h2>
          <p>Login is required to search for individuals.</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="button" to="/login">Login</Link>
            <Link className="button button--ghost" to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canHire) {
    return (
      <div className="container">
        <div className="panel">
          <h2>Hire Talent</h2>
          <p>Only company accounts can search and hire individuals.</p>
          <Link className="button button--ghost" to="/jobs">Back to Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="jobs-header">
        <div>
          <h2>Hire Individuals</h2>
          <p>Search job seekers by skills, location, and profession.</p>
        </div>
        <div className="jobs-summary">
          {loading ? 'Loading candidates...' : `${results.length} candidates`}
        </div>
      </div>

      <form className="panel jobs-search" onSubmit={handleSearch}>
        <div className="jobs-search__fields">
          <div className="field">
            <label htmlFor="hireSkills">Skills</label>
            <input
              id="hireSkills"
              placeholder="Comma-separated (e.g., cooking, POS, barista)"
              value={filters.skills}
              onChange={(event) => setFilters((prev) => ({ ...prev, skills: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="hireLocation">Location</label>
            <input
              id="hireLocation"
              placeholder="Colombo, Kandy, Galle"
              value={filters.location}
              onChange={(event) => setFilters((prev) => ({ ...prev, location: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="hireProfession">Profession</label>
            <input
              id="hireProfession"
              placeholder="Cashier, Tutor, Designer"
              value={filters.profession}
              onChange={(event) => setFilters((prev) => ({ ...prev, profession: event.target.value }))}
            />
          </div>
        </div>
        <div className="jobs-search__actions">
          <button className="button" type="submit">Search</button>
          <button className="button button--ghost" type="button" onClick={handleClear}>Clear</button>
        </div>
      </form>

      {error && <div className="notice notice--error">{error}</div>}
      {!loading && results.length === 0 && (
        <div className="panel jobs-empty">
          <h3>No matching candidates</h3>
          <p>Try adjusting your search filters.</p>
        </div>
      )}

      <div className="hire-grid">
        {results.map((person) => {
          const skills = formatSkills(person.skills);
          return (
            <article key={person.id} className="job-card">
              <div className="job-card__header">
                <div>
                  <h3>{person.fullName || 'Unnamed candidate'}</h3>
                  <p className="job-company">{person.profession || 'Profession not specified'}</p>
                </div>
                <span className="job-date">{person.location || 'Location not specified'}</span>
              </div>
              {person.bio && <p className="job-description">{person.bio}</p>}
              <div className="job-meta">
                <div>
                  <span className="job-meta__label">Phone</span>
                  <span>{person.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="job-meta__label">Email</span>
                  <span>{person.email || 'Not provided'}</span>
                </div>
              </div>
              {(person.preferredCategories || person.preferredSectors) && (
                <div className="job-meta">
                  {person.preferredCategories && (
                    <div>
                      <span className="job-meta__label">Preferred categories</span>
                      <span>{person.preferredCategories}</span>
                    </div>
                  )}
                  {person.preferredSectors && (
                    <div>
                      <span className="job-meta__label">Preferred sectors</span>
                      <span>{person.preferredSectors}</span>
                    </div>
                  )}
                </div>
              )}
              {skills.length > 0 && (
                <div className="job-tags">
                  {skills.map((skill) => (
                    <span key={`${person.id}-${skill}`} className="job-tag">{skill}</span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
