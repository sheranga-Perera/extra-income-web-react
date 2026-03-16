import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, IdentifierType, Role } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

type RegisterRole = 'INDIVIDUAL' | 'COMPANY';

type FieldErrors = Record<string, string>;

export default function Register() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [role, setRole] = useState<RegisterRole>('INDIVIDUAL');
  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({
    password: '',
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
    skills: ''
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

  const isValidEmail = (value: string) => /^(?!\s*$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value);

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
    if (!individual.skills.trim()) {
      errors.skills = 'Skills are required.';
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
  };

  const previousStep = () => {
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 0));
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
    setIsSubmitting(true);
    try {
      const username =
        role === 'INDIVIDUAL'
          ? (account.identifierType === 'EMAIL' ? individual.email : individual.phone)
          : (account.identifierType === 'EMAIL' ? company.contactEmail : company.contactPhone);

      await register({
        username,
        password: account.password,
        role: role as Role,
        identifierType: account.identifierType
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

        <div className="field">
          <label htmlFor="role">{t('role')}</label>
          <select
            id="role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RegisterRole);
              setStep(0);
              setFieldErrors({});
            }}
          >
            <option value="INDIVIDUAL">{t('individual')}</option>
            <option value="COMPANY">{t('company')}</option>
          </select>
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
              <div>
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
              <input
                value={individual.phone}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, phone: e.target.value }));
                  clearError('phone');
                }}
                className={fieldErrors.phone ? 'input--error' : undefined}
              />
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
              <input
                value={company.contactPhone}
                onChange={(e) => {
                  setCompany((prev) => ({ ...prev, contactPhone: e.target.value }));
                  clearError('contactPhone');
                }}
                className={fieldErrors.contactPhone ? 'input--error' : undefined}
              />
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
              <textarea
                value={individual.skills}
                onChange={(e) => {
                  setIndividual((prev) => ({ ...prev, skills: e.target.value }));
                  clearError('skills');
                }}
                className={fieldErrors.skills ? 'input--error' : undefined}
              />
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
            <div>{role === 'INDIVIDUAL' ? `${individual.firstName} ${individual.lastName}` : company.companyName}</div>
            <div>{role === 'INDIVIDUAL' ? individual.email : company.contactEmail}</div>
            <div>{role === 'INDIVIDUAL' ? individual.phone : company.contactPhone}</div>
            <div>{role === 'INDIVIDUAL' ? individual.profession : company.sector}</div>
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
            <button className="button" type="submit" disabled={isSubmitting}>
              {t('register')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
