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
        const data = await fetchProfile(role, token);
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
            <input value={company.companyName} onChange={(e) => setCompany((prev) => ({ ...prev, companyName: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('registrationNumber')}</label>
            <input value={company.registrationNumber} onChange={(e) => setCompany((prev) => ({ ...prev, registrationNumber: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('contactPerson')}</label>
            <input value={company.contactPerson} onChange={(e) => setCompany((prev) => ({ ...prev, contactPerson: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('contactEmail')}</label>
            <input value={company.contactEmail} onChange={(e) => setCompany((prev) => ({ ...prev, contactEmail: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('phone')}</label>
            <input value={company.phone} onChange={(e) => setCompany((prev) => ({ ...prev, phone: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('address')}</label>
            <input value={company.address} onChange={(e) => setCompany((prev) => ({ ...prev, address: e.target.value }))} />
          </div>
          <div className="field">
            <label>{t('website')}</label>
            <input value={company.website} onChange={(e) => setCompany((prev) => ({ ...prev, website: e.target.value }))} />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="field">
          <label>{t('fullName')}</label>
          <input value={individual.fullName} onChange={(e) => setIndividual((prev) => ({ ...prev, fullName: e.target.value }))} />
        </div>
        <div className="field">
          <label>{t('phone')}</label>
          <input value={individual.phone} onChange={(e) => setIndividual((prev) => ({ ...prev, phone: e.target.value }))} />
        </div>
        <div className="field">
          <label>{t('location')}</label>
          <input value={individual.location} onChange={(e) => setIndividual((prev) => ({ ...prev, location: e.target.value }))} />
        </div>
        <div className="field">
          <label>{t('bio')}</label>
          <textarea value={individual.bio} onChange={(e) => setIndividual((prev) => ({ ...prev, bio: e.target.value }))} />
        </div>
      </>
    );
  }, [role, company, individual, t]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !role) {
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const payload = role === 'COMPANY' ? company : individual;
      await saveProfile(role, token, payload);
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
        {error && <div className="notice">{error}</div>}
        {form}
        <button className="button" type="submit">{t('save')}</button>
      </form>
    </div>
  );
}
