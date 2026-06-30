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
        </div>

        <aside className="role-panel" aria-label={user ? t('I am a') : 'New user?'}>
          {user ? (
            <>
              <div>
                <p className="role-picker__label">{t('I am a')}</p>
                <h2>{t('welcomeBack')}</h2>
              </div>
              <Link className="button" to="/profile">{t('profile')}</Link>
            </>
          ) : (
            <>
              <div>
                <p className="role-picker__label">New user?</p>
                <h2>{t('chooseAccountType')}</h2>
              </div>
              <div className="role-picker">
                <Link className="role-picker__option" to="/register" state={{ role: 'INDIVIDUAL' }}>
                  <span>Job seeker</span>
                  <small>{t('findWork')}</small>
                </Link>
                <Link className="role-picker__option role-picker__option--accent" to="/register" state={{ role: 'COMPANY' }}>
                  <span>Job provider</span>
                  <small>{t('postJobs')}</small>
                </Link>
              </div>
            </>
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
