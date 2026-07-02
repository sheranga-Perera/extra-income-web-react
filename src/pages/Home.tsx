import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export default function Home() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">{t('homeEyebrow')}</p>
          <h1>{t('homeHeadline')}</h1>
          <p>{t('homeBody')}</p>
          <div className="home-hero__actions">
            <Link className="button" to="/jobs">{t('browseJobs')}</Link>
            <Link className="button button--ghost" to="/hire">{t('findPeople')}</Link>
          </div>
        </div>

        <aside className="role-panel" aria-label={t('I am a')}>
          <div>
            <p className="role-picker__label">{t('I am a')}</p>
            <h2>{user ? t('welcomeBack') : t('chooseAccountType')}</h2>
          </div>
          {!user && (
            <div className="role-picker">
              <Link className="role-picker__option" to="/register" state={{ role: 'INDIVIDUAL' }}>
                <span>{t('individual')}</span>
                <small>{t('findWork')}</small>
              </Link>
              <Link className="role-picker__option role-picker__option--accent" to="/register" state={{ role: 'COMPANY' }}>
                <span>{t('company')}</span>
                <small>{t('postJobs')}</small>
              </Link>
            </div>
          )}
          {user && (
            <Link className="button" to="/profile">{t('profile')}</Link>
          )}
        </aside>
      </section>

      <section className="home-steps" aria-label={t('howItWorks')}>
        <div className="home-step">
          <span>1</span>
          <h3>{t('createProfile')}</h3>
          <p>{t('createProfileText')}</p>
        </div>
        <div className="home-step">
          <span>2</span>
          <h3>{t('connect')}</h3>
          <p>{t('connectText')}</p>
        </div>
        <div className="home-step">
          <span>3</span>
          <h3>{t('startWorking')}</h3>
          <p>{t('startWorkingText')}</p>
        </div>
      </section>
    </main>
  );
}
