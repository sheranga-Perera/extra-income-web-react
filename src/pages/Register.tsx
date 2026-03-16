import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, IdentifierType, Role } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

type RegisterRole = 'INDIVIDUAL' | 'COMPANY';

type FieldErrors = Record<string, string>;

const COUNTRY_CODE = '+94';

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  reader.readAsDataURL(file);
});

const getRoleFromLocation = (state: unknown, search: string): RegisterRole => {
  const stateRole = (state as { role?: RegisterRole } | null)?.role;
  const queryRole = new URLSearchParams(search).get('role');
  const normalized = (stateRole ?? queryRole ?? 'INDIVIDUAL').toString().toUpperCase();
  return normalized === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL';
};

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState<RegisterRole>(() => getRoleFromLocation(location.state, location.search));
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({
    password: '',
    confirmPassword: '',
    identifierType: 'EMAIL' as IdentifierType
  });
  const [individual, setIndividual] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    nicFrontFile: null as File | null,
    nicBackFile: null as File | null,
    hasDriversLicense: false,
    driversLicenseType: '',
    profession: '',
    preferredCategories: '',
    preferredSectors: '',
    skills: [] as string[]
  });
  const [company, setCompany] = useState({
    companyName: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    bio: '',
    sector: '',
    legalDocs: [] as File[]
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [skillDraft, setSkillDraft] = useState('');

  useEffect(() => {
    const nextRole = getRoleFromLocation(location.state, location.search);
    if (nextRole !== role) {
      setRole(nextRole);
      setStep(0);
      setFieldErrors({});
    }
  }, [location.search, location.state, role]);

  const isValidEmail = (value: string) => /^(?!\s*$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => new RegExp(`^\\${COUNTRY_CODE}[0-9]{9}$`).test(value);

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

  const isAdult = (dob: string) => {
    if (!dob) {
      return false;
    }
    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age >= 18;
  };

  const steps = useMemo(() => {
    if (role === 'INDIVIDUAL') {
      return ['Personal details', 'Preferences & professional', 'Review'];
    }
    return ['Company details', 'Legal documents', 'Review'];
  }, [role]);

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

  const validateAccount = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!account.password) {
      errors.password = 'Password is required.';
    } else if (account.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (!account.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required.';
    } else if (account.confirmPassword !== account.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return errors;
  };

  const validateIndividualStep1 = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!individual.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!individual.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }
    if (!individual.dob) {
      errors.dob = 'Date of birth is required.';
    } else if (!isAdult(individual.dob)) {
      errors.dob = 'You must be at least 18 years old.';
    }
    if (!individual.gender.trim()) {
      errors.gender = 'Gender is required.';
    }
    if (!individual.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!isValidEmail(individual.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!individual.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (!isValidPhone(individual.phone.trim())) {
      errors.phone = 'Enter a valid phone number.';
    }
    if (!individual.nicFrontFile) {
      errors.nicFrontFile = 'Upload NIC front image.';
    }
    if (!individual.nicBackFile) {
      errors.nicBackFile = 'Upload NIC back image.';
    }
    if (individual.hasDriversLicense && !individual.driversLicenseType.trim()) {
      errors.driversLicenseType = 'Select a license type.';
    }
    return errors;
  };

  const validateIndividualStep2 = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!individual.profession.trim()) {
      errors.profession = 'Profession is required.';
    }
    if (!individual.preferredCategories.trim()) {
      errors.preferredCategories = 'Preferred categories are required.';
    }
    if (individual.skills.length === 0) {
      errors.skills = 'At least one skill is required.';
    }
    return errors;
  };

  const validateCompanyStep1 = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!company.companyName.trim()) {
      errors.companyName = 'Company name is required.';
    }
    if (!company.address.trim()) {
      errors.address = 'Company address is required.';
    }
    if (!company.contactPerson.trim()) {
      errors.contactPerson = 'Contact person is required.';
    }
    if (!company.contactEmail.trim()) {
      errors.contactEmail = 'Contact email is required.';
    } else if (!isValidEmail(company.contactEmail.trim())) {
      errors.contactEmail = 'Enter a valid email address.';
    }
    if (!company.contactPhone.trim()) {
      errors.contactPhone = 'Contact phone is required.';
    } else if (!isValidPhone(company.contactPhone.trim())) {
      errors.contactPhone = 'Enter a valid phone number.';
    }
    if (!company.sector.trim()) {
      errors.sector = 'Company sector is required.';
    }
    return errors;
  };

  const validateCompanyStep2 = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (company.legalDocs.length === 0) {
      errors.legalDocs = 'Upload at least one legal document.';
    }
    return errors;
  };

  const currentStepValidations = (): FieldErrors => {
    if (step === 0) {
      const accountErrors = validateAccount();
      if (role === 'INDIVIDUAL') {
        return { ...accountErrors, ...validateIndividualStep1() };
      }
      return { ...accountErrors, ...validateCompanyStep1() };
    }
    if (step === 1) {
      return role === 'INDIVIDUAL' ? validateIndividualStep2() : validateCompanyStep2();
    }
    return {};
  };

  const nextStep = () => {
    const validation = currentStepValidations();
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
    setIsConfirmed(false);
  };

  const previousStep = () => {
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
    setIsConfirmed(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const validation = currentStepValidations();
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    if (step < steps.length - 1) {
      nextStep();
      return;
    }
    if (!isConfirmed) {
      setFieldErrors((prev) => ({ ...prev, confirm: 'Please confirm the details before submitting.' }));
      return;
    }
    setIsSubmitting(true);
    try {
      const username =
        role === 'INDIVIDUAL'
          ? (account.identifierType === 'EMAIL' ? individual.email : individual.phone)
          : (account.identifierType === 'EMAIL' ? company.contactEmail : company.contactPhone);

      let nicFrontData: string | null = null;
      let nicBackData: string | null = null;
      let legalDocsData: string[] = [];

      if (role === 'INDIVIDUAL') {
        if (individual.nicFrontFile) {
          nicFrontData = await readFileAsDataUrl(individual.nicFrontFile);
        }
        if (individual.nicBackFile) {
          nicBackData = await readFileAsDataUrl(individual.nicBackFile);
        }
      }

      if (role === 'COMPANY' && company.legalDocs.length > 0) {
        legalDocsData = await Promise.all(company.legalDocs.map(readFileAsDataUrl));
      }

      await register({
        username,
        password: account.password,
        confirmPassword: account.confirmPassword,
        role: role as Role,
        identifierType: account.identifierType,
            ...(role === 'INDIVIDUAL'
              ? {
                  firstName: individual.firstName.trim(),
                  lastName: individual.lastName.trim(),
                  dob: individual.dob,
                  gender: individual.gender,
                  email: individual.email.trim(),
                  phone: individual.phone.trim(),
                  address: individual.address.trim(),
                  nicFront: nicFrontData ?? '',
                  nicBack: nicBackData ?? '',
                  hasDriversLicense: individual.hasDriversLicense,
                  driversLicenseType: individual.driversLicenseType.trim(),
                  profession: individual.profession.trim(),
                  preferredCategories: individual.preferredCategories.trim(),
                  preferredSectors: individual.preferredSectors.trim(),
                  skills: individual.skills.join(', ')
                }
          : {
              companyName: company.companyName.trim(),
              address: company.address.trim(),
              contactPerson: company.contactPerson.trim(),
              contactEmail: company.contactEmail.trim(),
              contactPhone: company.contactPhone.trim(),
              bio: company.bio.trim(),
              sector: company.sector.trim(),
              legalDocs: legalDocsData
            })
      });
      navigate('/profile');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>{t('register')}</h2>
        {error && <div className="notice notice--error">{error}</div>}

        <div className="stepper">
          {steps.map((label, index) => (
            <span
              key={label}
              className={`stepper__step ${index === step ? 'stepper__step--active' : ''}`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>

        {step === 0 && role === 'INDIVIDUAL' && (
          <>
            <div className="field">
              <label>First name</label>
              <input
                value={individual.firstName}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, firstName: e.target.value }));
                  clearError('firstName');
                }}
                className={fieldErrors.firstName ? 'input--error' : undefined}
              />
              {fieldErrors.firstName && <span className="field__error">{fieldErrors.firstName}</span>}
            </div>
            <div className="field">
              <label>Last name</label>
              <input
                value={individual.lastName}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, lastName: e.target.value }));
                  clearError('lastName');
                }}
                className={fieldErrors.lastName ? 'input--error' : undefined}
              />
              {fieldErrors.lastName && <span className="field__error">{fieldErrors.lastName}</span>}
            </div>
            <div className="field">
              <label>Date of birth</label>
              <input
                type="date"
                value={individual.dob}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, dob: e.target.value }));
                  clearError('dob');
                }}
                className={fieldErrors.dob ? 'input--error' : undefined}
              />
              {fieldErrors.dob && <span className="field__error">{fieldErrors.dob}</span>}
            </div>
            <div className="field">
              <label>Gender</label>
              <div className="field__options">
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={individual.gender === 'Male'}
                    onChange={(e) => {
                      setIndividual((prev) => ({ ...prev, gender: e.target.value }));
                      clearError('gender');
                    }}
                  />{' '}
                  Male
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={individual.gender === 'Female'}
                    onChange={(e) => {
                      setIndividual((prev) => ({ ...prev, gender: e.target.value }));
                      clearError('gender');
                    }}
                  />{' '}
                  Female
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="Other"
                    checked={individual.gender === 'Other'}
                    onChange={(e) => {
                      setIndividual((prev) => ({ ...prev, gender: e.target.value }));
                      clearError('gender');
                    }}
                  />{' '}
                  Other
                </label>
              </div>
              {fieldErrors.gender && <span className="field__error">{fieldErrors.gender}</span>}
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
              <label>Phone</label>
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
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setIndividual((prev) => ({ ...prev, nicFrontFile: file }));
                  clearError('nicFrontFile');
                }}
                className={fieldErrors.nicFrontFile ? 'input--error' : undefined}
              />
              {fieldErrors.nicFrontFile && <span className="field__error">{fieldErrors.nicFrontFile}</span>}
            </div>
            <div className="field">
              <label>NIC back</label>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setIndividual((prev) => ({ ...prev, nicBackFile: file }));
                  clearError('nicBackFile');
                }}
                className={fieldErrors.nicBackFile ? 'input--error' : undefined}
              />
              {fieldErrors.nicBackFile && <span className="field__error">{fieldErrors.nicBackFile}</span>}
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
                    clearError('driversLicenseType');
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
                  onChange={(e) => {
                    setIndividual((prev) => ({ ...prev, driversLicenseType: e.target.value }));
                    clearError('driversLicenseType');
                  }}
                  className={fieldErrors.driversLicenseType ? 'input--error' : undefined}
                >
                  <option value="">Select</option>
                  <option value="LIGHT">Light vehicle</option>
                  <option value="HEAVY">Heavy vehicle</option>
                </select>
                {fieldErrors.driversLicenseType && (
                  <span className="field__error">{fieldErrors.driversLicenseType}</span>
                )}
              </div>
            )}
            <div className="field">
              <label htmlFor="identifier">{t('identifier')}</label>
              <select
                id="identifier"
                value={account.identifierType}
                onChange={(e) => setAccount((prev) => ({ ...prev, identifierType: e.target.value as IdentifierType }))}
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
            <div className="field">
              <label>{t('password')}</label>
              <input
                type="password"
                value={account.password}
                onChange={(e) => {
                  setAccount((prev) => ({ ...prev, password: e.target.value }));
                  clearError('password');
                }}
                className={fieldErrors.password ? 'input--error' : undefined}
              />
              {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input
                type="password"
                value={account.confirmPassword}
                onChange={(e) => {
                  setAccount((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  clearError('confirmPassword');
                }}
                className={fieldErrors.confirmPassword ? 'input--error' : undefined}
              />
              {fieldErrors.confirmPassword && (
                <span className="field__error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </>
        )}

        {step === 0 && role === 'COMPANY' && (
          <>
            <div className="field">
              <label>Company name</label>
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
              <label>Company address</label>
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
              <label>Contact person</label>
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
              <label>Contact email</label>
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
              <label>Contact phone</label>
              <div className="phone-input">
                <select value={COUNTRY_CODE} aria-label="Country code" onChange={() => undefined}>
                  <option value={COUNTRY_CODE}>+94 (Sri Lanka)</option>
                </select>
                <input
                  placeholder="7x xxx xxxx"
                  inputMode="numeric"
                  value={getLocalPhone(company.contactPhone)}
                  onChange={(e) => {
                    setCompany((prev) => ({ ...prev, contactPhone: toFullPhone(e.target.value) }));
                    clearError('contactPhone');
                  }}
                  className={fieldErrors.contactPhone ? 'input--error' : undefined}
                />
              </div>
              {fieldErrors.contactPhone && <span className="field__error">{fieldErrors.contactPhone}</span>}
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
                onChange={(e) => {
                  setCompany((prev) => ({ ...prev, sector: e.target.value }));
                  clearError('sector');
                }}
                className={fieldErrors.sector ? 'input--error' : undefined}
              />
              {fieldErrors.sector && <span className="field__error">{fieldErrors.sector}</span>}
            </div>
            <div className="field">
              <label htmlFor="identifier">{t('identifier')}</label>
              <select
                id="identifier"
                value={account.identifierType}
                onChange={(e) => setAccount((prev) => ({ ...prev, identifierType: e.target.value as IdentifierType }))}
              >
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
            <div className="field">
              <label>{t('password')}</label>
              <input
                type="password"
                value={account.password}
                onChange={(e) => {
                  setAccount((prev) => ({ ...prev, password: e.target.value }));
                  clearError('password');
                }}
                className={fieldErrors.password ? 'input--error' : undefined}
              />
              {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
            </div>
            <div className="field">
              <label>Confirm password</label>
              <input
                type="password"
                value={account.confirmPassword}
                onChange={(e) => {
                  setAccount((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  clearError('confirmPassword');
                }}
                className={fieldErrors.confirmPassword ? 'input--error' : undefined}
              />
              {fieldErrors.confirmPassword && (
                <span className="field__error">{fieldErrors.confirmPassword}</span>
              )}
            </div>
          </>
        )}

        {step === 1 && role === 'INDIVIDUAL' && (
          <>
            <div className="field">
              <label>Profession</label>
              <input
                value={individual.profession}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, profession: e.target.value }));
                  clearError('profession');
                }}
                className={fieldErrors.profession ? 'input--error' : undefined}
              />
              {fieldErrors.profession && <span className="field__error">{fieldErrors.profession}</span>}
            </div>
            <div className="field">
              <label>Preferred categories</label>
              <input
                value={individual.preferredCategories}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, preferredCategories: e.target.value }));
                  clearError('preferredCategories');
                }}
                className={fieldErrors.preferredCategories ? 'input--error' : undefined}
              />
              {fieldErrors.preferredCategories && <span className="field__error">{fieldErrors.preferredCategories}</span>}
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
                    clearError('skills');
                  }}
                  className={fieldErrors.skills ? 'input--error' : undefined}
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
                    clearError('skills');
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
              {fieldErrors.skills && <span className="field__error">{fieldErrors.skills}</span>}
            </div>
          </>
        )}

        {step === 1 && role === 'COMPANY' && (
          <>
            <div className="field">
              <label>Legal documents</label>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  setCompany((prev) => ({ ...prev, legalDocs: files }));
                  clearError('legalDocs');
                }}
                className={fieldErrors.legalDocs ? 'input--error' : undefined}
              />
              {fieldErrors.legalDocs && <span className="field__error">{fieldErrors.legalDocs}</span>}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="notice">
            <strong>Review</strong>
            {role === 'INDIVIDUAL' ? (
              <div className="review-grid">
                <div className="review-row">
                  <span className="review-label">First name</span>
                  <span>{individual.firstName}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Last name</span>
                  <span>{individual.lastName}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Date of birth</span>
                  <span>{individual.dob}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Gender</span>
                  <span>{individual.gender}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Email</span>
                  <span>{individual.email}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Phone</span>
                  <span>{individual.phone}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Address</span>
                  <span>{individual.address || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">NIC front</span>
                  <span>{individual.nicFrontFile ? individual.nicFrontFile.name : 'Not uploaded'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">NIC back</span>
                  <span>{individual.nicBackFile ? individual.nicBackFile.name : 'Not uploaded'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Driver’s license</span>
                  <span>{individual.hasDriversLicense ? 'Yes' : 'No'}</span>
                </div>
                {individual.hasDriversLicense && (
                  <div className="review-row">
                    <span className="review-label">License type</span>
                    <span>{individual.driversLicenseType || '—'}</span>
                  </div>
                )}
                <div className="review-row">
                  <span className="review-label">Profession</span>
                  <span>{individual.profession}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Preferred categories</span>
                  <span>{individual.preferredCategories}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Preferred sectors</span>
                  <span>{individual.preferredSectors || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Skills</span>
                  <span>{individual.skills.length > 0 ? individual.skills.join(', ') : '—'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Identifier</span>
                  <span>{account.identifierType}</span>
                </div>
              </div>
            ) : (
              <div className="review-grid">
                <div className="review-row">
                  <span className="review-label">Company name</span>
                  <span>{company.companyName}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Address</span>
                  <span>{company.address}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Contact person</span>
                  <span>{company.contactPerson}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Contact email</span>
                  <span>{company.contactEmail}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Contact phone</span>
                  <span>{company.contactPhone}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Company bio</span>
                  <span>{company.bio || '—'}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Sector</span>
                  <span>{company.sector}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Legal documents</span>
                  <span>
                    {company.legalDocs.length > 0
                      ? company.legalDocs.map((file) => file.name).join(', ')
                      : 'Not uploaded'}
                  </span>
                </div>
                <div className="review-row">
                  <span className="review-label">Identifier</span>
                  <span>{account.identifierType}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="stepper__actions">
          {step > 0 && (
            <button className="button button--ghost" type="button" onClick={previousStep}>
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button className="button" type="button" onClick={nextStep}>
              Next
            </button>
          ) : (
            <>
              <label className="confirm-row">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => {
                    setIsConfirmed(e.target.checked);
                    clearError('confirm');
                  }}
                />{' '}
                I confirm the details are correct.
              </label>
              {fieldErrors.confirm && <span className="field__error">{fieldErrors.confirm}</span>}
              <button className="button" type="submit" disabled={isSubmitting || !isConfirmed}>
                Confirm registration
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
