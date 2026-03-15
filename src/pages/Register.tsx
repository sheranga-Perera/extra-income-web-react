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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (value: string) => /^(?!\s*$)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value: string) => /^\+?[0-9]{7,15}$/.test(value);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) {
      errors.username = 'Username is required.';
    } else if (form.identifierType === 'EMAIL' && !isValidEmail(form.username.trim())) {
      errors.username = 'Enter a valid email address.';
    } else if (form.identifierType === 'PHONE' && !isValidPhone(form.username.trim())) {
      errors.username = 'Enter a valid phone number.';
    }

    if (!form.password) {
      errors.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    return errors;
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setFieldErrors(validation);
      return;
    }
    setIsSubmitting(true);
    try {
      await register(form);
      await refresh();
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
        <div className="field">
          <label htmlFor="username">{t('username')}</label>
          <input
            id="username"
            value={form.username}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, username: e.target.value }));
              clearError('username');
            }}
            className={fieldErrors.username ? 'input--error' : undefined}
          />
          {fieldErrors.username && <span className="field__error">{fieldErrors.username}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">{t('password')}</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, password: e.target.value }));
              clearError('password');
            }}
            className={fieldErrors.password ? 'input--error' : undefined}
          />
          {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
        </div>
        <div className="field">
          <label htmlFor="identifier">{t('identifier')}</label>
          <select
            id="identifier"
            value={form.identifierType}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, identifierType: e.target.value as IdentifierType }));
              clearError('username');
            }}
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
        <button className="button" type="submit" disabled={isSubmitting}>{t('register')}</button>
      </form>
    </div>
  );
}
