import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">{t('appName')}</Link>
      <div className="navbar__links">
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
        >
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
        {!user ? (
          <>
            <Link to="/login">{t('login')}</Link>
            <Link to="/register" className="button button--ghost">{t('register')}</Link>
          </>
        ) : (
          <>
            <Link to="/profile">{t('profile')}</Link>
            <button className="button" type="button" onClick={logout}>
              {t('logout')}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
