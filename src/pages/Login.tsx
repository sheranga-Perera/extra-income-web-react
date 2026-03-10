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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await login(username, password);
      await refresh();
      navigate('/profile');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <form className="form" onSubmit={handleSubmit}>
        <h2>{t('login')}</h2>
        {error && <div className="notice">{error}</div>}
        <div className="field">
          <label htmlFor="username">{t('username')}</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">{t('password')}</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="button" type="submit">{t('login')}</button>
      </form>
    </div>
  );
}
