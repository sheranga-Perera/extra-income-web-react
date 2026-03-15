import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, saveProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface IndividualState {
  fullName: string;
  phone: string;
  location: string;
  bio: string;
}

interface CompanyState {
  companyName: string;
  registrationNumber: string;
  contactPerson: string;
  contactEmail: string;
  phone: string;
  address: string;
  website: string;
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
    bio: ''
  });

  const [company, setCompany] = useState<CompanyState>({
    companyName: '',
    registrationNumber: '',
    contactPerson: '',
    contactEmail: '',
    phone: '',
    address: '',
    website: ''
  });

  const role = user?.role;

  const isValidEmail = (value: string) => /^(?!\s*$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value);
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
            website: data.website ?? ''
          });
        } else {
          setIndividual({
            fullName: data.fullName ?? '',
            phone: data.phone ?? '',
            location: data.location ?? '',
            bio: data.bio ?? ''
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
            <input
              value={company.phone}
              onChange={(e) => {
                setCompany((prev) => ({ ...prev, phone: e.target.value }));
                clearError('phone');
              }}
              className={fieldErrors.phone ? 'input--error' : undefined}
            />
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
          <label>{t('phone')}</label>
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
      const payload = role === 'COMPANY' ? company : individual;
      await saveProfile(role, payload);
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
