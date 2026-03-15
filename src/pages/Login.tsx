import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Login() {
  const { login, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!username.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
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
      await login(username, password);
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
        <h2>{t('login')}</h2>
        {error && <div className="notice notice--error">{error}</div>}
        <div className="field">
          <label htmlFor="username">{t('username')}</label>
          <input
            id="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
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
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            className={fieldErrors.password ? 'input--error' : undefined}
          />
          {fieldErrors.password && <span className="field__error">{fieldErrors.password}</span>}
        </div>
        <button className="button" type="submit" disabled={isSubmitting}>{t('login')}</button>
      </form>
    </div>
  );
}
