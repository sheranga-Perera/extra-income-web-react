import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, IdentifierType, Role } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Register() {
  const { register, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'INDIVIDUAL' as Role,
    identifierType: 'EMAIL' as IdentifierType
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await register(form);
      await refresh();
      navigate('/profile');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>{t('register')}</h2>
        {error && <div className="notice">{error}</div>}
        <div className="field">
          <label htmlFor="username">{t('username')}</label>
          <input
            id="username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t('password')}</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="identifier">{t('identifier')}</label>
          <select
            id="identifier"
            value={form.identifierType}
            onChange={(e) => setForm((prev) => ({ ...prev, identifierType: e.target.value as IdentifierType }))}
          >
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="role">{t('role')}</label>
          <select
            id="role"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
          >
            <option value="INDIVIDUAL">{t('individual')}</option>
            <option value="COMPANY">{t('company')}</option>
          </select>
        </div>
        <button className="button" type="submit">{t('register')}</button>
      </form>
    </div>
  );
}
