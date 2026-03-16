import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="container">
      <section className="hero">
        <div>
          <h1>{t('homeHeadline')}</h1>
          <p>{t('homeBody')}</p>
          {!user && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link className="button" to="/register" state={{ role: 'INDIVIDUAL' }}>
                {t('register')} ({t('individual')})
              </Link>
              <Link className="button button--ghost" to="/register" state={{ role: 'COMPANY' }}>
                {t('register')} ({t('company')})
              </Link>
              <Link className="button button--ghost" to="/login">{t('login')}</Link>
            </div>
          )}
        </div>
        <div className="hero__card">
          <h3>V1 Focus</h3>
          <ul>
            <li>Secure login and registration</li>
            <li>Individual and company profiles</li>
            <li>Trilingual interface (English, Sinhala, Tamil)</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
