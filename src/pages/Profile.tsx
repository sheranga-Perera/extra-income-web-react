import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, saveProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

const COUNTRY_CODE = '+94';

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  reader.readAsDataURL(file);
});

const parseSkills = (value: string) => value
  .split(',')
  .map((skill) => skill.trim())
  .filter((skill) => skill.length > 0);

interface IndividualState {
  fullName: string;
  phone: string;
  location: string;
  bio: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  address: string;
  nicFront: string;
  nicBack: string;
  hasDriversLicense: boolean;
  driversLicenseType: string;
  profession: string;
  preferredCategories: string;
  preferredSectors: string;
  skills: string[];
}

interface CompanyState {
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  address: string;
  website: string;
  bio: string;
  sector: string;
  legalDocs: string[];
}

export default function Profile() {
  const { user, token, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [individual, setIndividual] = useState<IndividualState>({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    email: '',
    address: '',
    nicFront: '',
    nicBack: '',
    hasDriversLicense: false,
    driversLicenseType: '',
    profession: '',
    preferredCategories: '',
    preferredSectors: '',
    skills: []
  });

  const [company, setCompany] = useState<CompanyState>({
    companyName: '',
    registrationNumber: '',
    contactPerson: '',
    contactEmail: '',
    phone: '',
    address: '',
    website: '',
    bio: '',
    sector: '',
    legalDocs: []
  });
  const [individualNicFrontFile, setIndividualNicFrontFile] = useState<File | null>(null);
  const [individualNicBackFile, setIndividualNicBackFile] = useState<File | null>(null);
  const [companyLegalDocFiles, setCompanyLegalDocFiles] = useState<File[]>([]);
  const [skillDraft, setSkillDraft] = useState('');

  const role = user?.role;

  const isValidEmail = (value: string) => /^(?!\s*$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => new RegExp(`^\\${COUNTRY_CODE}[0-9]{9}$`).test(value);
  const isValidUrl = (value: string) => {
    if (!value) {
      return true;
    }
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const getLocalPhone = (value: string) => {
    if (!value) {
      return '';
    }
    return value.startsWith(COUNTRY_CODE) ? value.slice(COUNTRY_CODE.length) : value.replace(/\D/g, '');
  };

  const toFullPhone = (local: string) => {
    const digits = local.replace(/\D/g, '');
    const normalized = digits.startsWith('0') ? digits.slice(1) : digits;
    return normalized ? `${COUNTRY_CODE}${normalized}` : '';
  };

  const clearError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateProfile = () => {
    const errors: Record<string, string> = {};
    if (role === 'COMPANY') {
      if (!company.companyName.trim()) {
        errors.companyName = 'Company name is required.';
      }
      if (!company.registrationNumber.trim()) {
        errors.registrationNumber = 'Registration number is required.';
      }
      if (!company.contactPerson.trim()) {
        errors.contactPerson = 'Contact person is required.';
      }
      if (!company.contactEmail.trim()) {
        errors.contactEmail = 'Contact email is required.';
      } else if (!isValidEmail(company.contactEmail.trim())) {
        errors.contactEmail = 'Enter a valid email address.';
      }
      if (!company.phone.trim()) {
        errors.phone = 'Phone number is required.';
      } else if (!isValidPhone(company.phone.trim())) {
        errors.phone = 'Enter a valid phone number.';
      }
      if (!company.address.trim()) {
        errors.address = 'Address is required.';
      }
      if (!isValidUrl(company.website.trim())) {
        errors.website = 'Enter a valid website URL.';
      }
      return errors;
    }

    if (!individual.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    if (individual.email.trim() && !isValidEmail(individual.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!individual.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!isValidPhone(individual.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }
    if (!individual.location.trim()) {
      errors.location = 'Location is required.';
    }
    if (individual.bio.trim().length > 1000) {
      errors.bio = 'Bio must be 1000 characters or fewer.';
    }
    return errors;
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    refresh().catch(() => undefined);
  }, [token, navigate, refresh]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token || !role) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchProfile(role);
        if (role === 'COMPANY') {
          setCompany({
            companyName: data.companyName ?? '',
            registrationNumber: data.registrationNumber ?? '',
            contactPerson: data.contactPerson ?? '',
            contactEmail: data.contactEmail ?? '',
            phone: data.phone ?? '',
            address: data.address ?? '',
            website: data.website ?? '',
            bio: data.bio ?? '',
            sector: data.sector ?? '',
            legalDocs: data.legalDocs ?? []
          });
        } else {
          setIndividual({
            fullName: data.fullName ?? '',
            phone: data.phone ?? '',
            location: data.location ?? '',
            bio: data.bio ?? '',
            firstName: data.firstName ?? '',
            lastName: data.lastName ?? '',
            dob: data.dob ?? '',
            gender: data.gender ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            nicFront: data.nicFront ?? '',
            nicBack: data.nicBack ?? '',
            hasDriversLicense: data.hasDriversLicense ?? false,
            driversLicenseType: data.driversLicenseType ?? '',
            profession: data.profession ?? '',
            preferredCategories: data.preferredCategories ?? '',
            preferredSectors: data.preferredSectors ?? '',
            skills: data.skills ? parseSkills(data.skills) : []
          });
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token, role]);

  const form = useMemo(() => {
    if (role === 'COMPANY') {
      return (
        <>
          <div className="field">
            <label>{t('companyName')}</label>
            <input
              value={company.companyName}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, companyName: e.target.value }));
                clearError('companyName');
              }}
              className={fieldErrors.companyName ? 'input--error' : undefined}
            />
            {fieldErrors.companyName && <span className="field__error">{fieldErrors.companyName}</span>}
          </div>
          <div className="field">
            <label>{t('registrationNumber')}</label>
            <input
              value={company.registrationNumber}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, registrationNumber: e.target.value }));
                clearError('registrationNumber');
              }}
              className={fieldErrors.registrationNumber ? 'input--error' : undefined}
            />
            {fieldErrors.registrationNumber && <span className="field__error">{fieldErrors.registrationNumber}</span>}
          </div>
          <div className="field">
            <label>{t('contactPerson')}</label>
            <input
              value={company.contactPerson}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, contactPerson: e.target.value }));
                clearError('contactPerson');
              }}
              className={fieldErrors.contactPerson ? 'input--error' : undefined}
            />
            {fieldErrors.contactPerson && <span className="field__error">{fieldErrors.contactPerson}</span>}
          </div>
          <div className="field">
            <label>{t('contactEmail')}</label>
            <input
              value={company.contactEmail}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, contactEmail: e.target.value }));
                clearError('contactEmail');
              }}
              className={fieldErrors.contactEmail ? 'input--error' : undefined}
            />
            {fieldErrors.contactEmail && <span className="field__error">{fieldErrors.contactEmail}</span>}
          </div>
          <div className="field">
            <label>{t('phone')}</label>
            <div className="phone-input">
              <select value={COUNTRY_CODE} aria-label="Country code" onChange={() => undefined}>
                <option value={COUNTRY_CODE}>+94 (Sri Lanka)</option>
              </select>
              <input
                placeholder="7x xxx xxxx"
                inputMode="numeric"
                value={getLocalPhone(company.phone)}
                onChange={(e) => {
                  setCompany((prev) => ({ ...prev, phone: toFullPhone(e.target.value) }));
                  clearError('phone');
                }}
                className={fieldErrors.phone ? 'input--error' : undefined}
              />
            </div>
            {fieldErrors.phone && <span className="field__error">{fieldErrors.phone}</span>}
          </div>
          <div className="field">
            <label>{t('address')}</label>
            <input
              value={company.address}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, address: e.target.value }));
                clearError('address');
              }}
              className={fieldErrors.address ? 'input--error' : undefined}
            />
            {fieldErrors.address && <span className="field__error">{fieldErrors.address}</span>}
          </div>
          <div className="field">
            <label>{t('website')}</label>
            <input
              value={company.website}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, website: e.target.value }));
                clearError('website');
              }}
              className={fieldErrors.website ? 'input--error' : undefined}
            />
            {fieldErrors.website && <span className="field__error">{fieldErrors.website}</span>}
          </div>
          <div className="field">
            <label>Company bio</label>
            <textarea
              value={company.bio}
              onChange={(e) => setCompany((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Company sector</label>
            <input
              value={company.sector}
              onChange={(e) => setCompany((prev) => ({ ...prev, sector: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Legal documents</label>
            <input
              value={company.legalDocs.length > 0 ? `${company.legalDocs.length} document(s) uploaded` : 'Not uploaded'}
              disabled
            />
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setCompanyLegalDocFiles(files);
              }}
            />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="field">
          <label>{t('fullName')}</label>
          <input
            value={individual.fullName}
            onChange={(e) => {
              setIndividual((prev) => ({ ...prev, fullName: e.target.value }));
              clearError('fullName');
            }}
            className={fieldErrors.fullName ? 'input--error' : undefined}
          />
          {fieldErrors.fullName && <span className="field__error">{fieldErrors.fullName}</span>}
        </div>
        <div className="field">
          <label>First name</label>
          <input
            value={individual.firstName}
            onChange={(e) => setIndividual((prev) => ({ ...prev, firstName: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Last name</label>
          <input
            value={individual.lastName}
            onChange={(e) => setIndividual((prev) => ({ ...prev, lastName: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Date of birth</label>
          <input
            type="date"
            value={individual.dob}
            onChange={(e) => setIndividual((prev) => ({ ...prev, dob: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Gender</label>
          <select
            value={individual.gender}
            onChange={(e) => setIndividual((prev) => ({ ...prev, gender: e.target.value }))}
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Email</label>
          <input
            value={individual.email}
            onChange={(e) => {
              setIndividual((prev) => ({ ...prev, email: e.target.value }));
              clearError('email');
            }}
            className={fieldErrors.email ? 'input--error' : undefined}
          />
          {fieldErrors.email && <span className="field__error">{fieldErrors.email}</span>}
        </div>
        <div className="field">
          <label>{t('phone')}</label>
          <div className="phone-input">
            <select value={COUNTRY_CODE} aria-label="Country code" onChange={() => undefined}>
              <option value={COUNTRY_CODE}>+94 (Sri Lanka)</option>
            </select>
            <input
              placeholder="7x xxx xxxx"
              inputMode="numeric"
              value={getLocalPhone(individual.phone)}
              onChange={(e) => {
                setIndividual((prev) => ({ ...prev, phone: toFullPhone(e.target.value) }));
                clearError('phone');
              }}
              className={fieldErrors.phone ? 'input--error' : undefined}
            />
          </div>
          {fieldErrors.phone && <span className="field__error">{fieldErrors.phone}</span>}
        </div>
        <div className="field">
          <label>Address</label>
          <input
            value={individual.address}
            onChange={(e) => setIndividual((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>NIC front</label>
          <input value={individual.nicFront ? 'Uploaded' : 'Not uploaded'} disabled />
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setIndividualNicFrontFile(file);
            }}
          />
        </div>
        <div className="field">
          <label>NIC back</label>
          <input value={individual.nicBack ? 'Uploaded' : 'Not uploaded'} disabled />
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setIndividualNicBackFile(file);
            }}
          />
        </div>
        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={individual.hasDriversLicense}
              onChange={(e) => {
                const checked = e.target.checked;
                setIndividual((prev) => ({
                  ...prev,
                  hasDriversLicense: checked,
                  driversLicenseType: checked ? prev.driversLicenseType : ''
                }));
              }}
            />{' '}
            Has valid driver’s license
          </label>
        </div>
        {individual.hasDriversLicense && (
          <div className="field">
            <label>License type</label>
            <select
              value={individual.driversLicenseType}
              onChange={(e) => setIndividual((prev) => ({ ...prev, driversLicenseType: e.target.value }))}
            >
              <option value="">Select</option>
              <option value="LIGHT">Light vehicle</option>
              <option value="HEAVY">Heavy vehicle</option>
            </select>
          </div>
        )}
        <div className="field">
          <label>{t('location')}</label>
          <input
            value={individual.location}
            onChange={(e) => {
              setIndividual((prev) => ({ ...prev, location: e.target.value }));
              clearError('location');
            }}
            className={fieldErrors.location ? 'input--error' : undefined}
          />
          {fieldErrors.location && <span className="field__error">{fieldErrors.location}</span>}
        </div>
        <div className="field">
          <label>Profession</label>
          <input
            value={individual.profession}
            onChange={(e) => setIndividual((prev) => ({ ...prev, profession: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Preferred categories</label>
          <input
            value={individual.preferredCategories}
            onChange={(e) => setIndividual((prev) => ({ ...prev, preferredCategories: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Preferred sectors</label>
          <input
            value={individual.preferredSectors}
            onChange={(e) => setIndividual((prev) => ({ ...prev, preferredSectors: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Skills</label>
          <div className="skill-input">
            <input
              placeholder="Add a skill and press Enter"
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') {
                  return;
                }
                e.preventDefault();
                const cleaned = skillDraft.trim();
                if (!cleaned) {
                  return;
                }
                const exists = individual.skills.some((skill) => skill.toLowerCase() === cleaned.toLowerCase());
                if (exists) {
                  setSkillDraft('');
                  return;
                }
                setIndividual((prev) => ({ ...prev, skills: [...prev.skills, cleaned] }));
                setSkillDraft('');
              }}
            />
            <button
              className="button button--ghost"
              type="button"
              onClick={() => {
                const cleaned = skillDraft.trim();
                if (!cleaned) {
                  return;
                }
                const exists = individual.skills.some((skill) => skill.toLowerCase() === cleaned.toLowerCase());
                if (exists) {
                  setSkillDraft('');
                  return;
                }
                setIndividual((prev) => ({ ...prev, skills: [...prev.skills, cleaned] }));
                setSkillDraft('');
              }}
            >
              Add
            </button>
          </div>
          {individual.skills.length > 0 && (
            <div className="skill-list">
              {individual.skills.map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                  <button
                    type="button"
                    aria-label={`Remove ${skill}`}
                    onClick={() => {
                      setIndividual((prev) => ({
                        ...prev,
                        skills: prev.skills.filter((item) => item !== skill)
                      }));
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label>{t('bio')}</label>
          <textarea
            value={individual.bio}
            onChange={(e) => {
              setIndividual((prev) => ({ ...prev, bio: e.target.value }));
              clearError('bio');
            }}
            className={fieldErrors.bio ? 'input--error' : undefined}
          />
          {fieldErrors.bio && <span className="field__error">{fieldErrors.bio}</span>}
        </div>
      </>
    );
  }, [role, company, individual, t, fieldErrors]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !role) {
      return;
    }
    setError(null);
    setNotice(null);
    const validation = validateProfile();
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    try {
      if (role === 'COMPANY') {
        const legalDocs = companyLegalDocFiles.length > 0
          ? await Promise.all(companyLegalDocFiles.map(readFileAsDataUrl))
          : company.legalDocs;

        await saveProfile(role, {
          ...company,
          legalDocs
        });
      } else {
        const nicFront = individualNicFrontFile
          ? await readFileAsDataUrl(individualNicFrontFile)
          : individual.nicFront;
        const nicBack = individualNicBackFile
          ? await readFileAsDataUrl(individualNicBackFile)
          : individual.nicBack;

        await saveProfile(role, {
          ...individual,
          nicFront,
          nicBack,
          skills: individual.skills.join(', ')
        });
      }
      setNotice(t('successSaved'));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!role) {
    return null;
  }

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>{t('profile')}</h2>
        {loading && <div className="notice">Loading...</div>}
        {notice && <div className="notice">{notice}</div>}
        {error && <div className="notice notice--error">{error}</div>}
        {form}
        <button className="button" type="submit">{t('save')}</button>
      </form>
    </div>
  );
}
